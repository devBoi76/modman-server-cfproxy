import * as util from "./util"
import * as filedef from "./filedef"

export class TrackedPackage {
    cf_id: number;
    slug: string; // name of the package i.e. `xaeros-minimap`
    last_modified: number;
    constructor(cf_id: number, slug: string, last_modified: number) {
        this.cf_id = cf_id;
        this.slug = slug;
        this.last_modified = last_modified;
    }
    static mark_updated(cf_id: number, slug: string) {
        let tracked = filedef.get_tracked();
        if (!tracked.cf_ids.includes(cf_id)) {
            tracked.cf_ids.push(cf_id);
        }
        if (!tracked.packages.map( (pkg) => {return pkg.cf_id;}).includes(cf_id)) {

            let t = new this(cf_id, slug, Date.now());
            tracked.packages.push(t);

        } else {
            let ti = tracked.packages.findIndex( (pkg) => {return pkg.cf_id == cf_id});
            tracked.packages[ti].last_modified = Date.now();
        }
        filedef.write(tracked, "tracked");
    }
}

export class Release {
    id: number;
    version: string;
    game_version: string;
    deps: Array<string>; // short slugs of locators
    parent_locator: string; // short slug with the release id of this release
    released: number; // utc timestamp
    updated?: number;
    is_dependency?: boolean;
    downloads: number;
    direct_link: string;
    prefer_link: boolean;
    
    constructor(id: number, version: string, game_version: string, deps: Array<string>, parent_locator: string, released: number, is_dependency: boolean, downloads: number, direct_link: string, prefer_link: boolean) {
        this.id = id;
        this.version = version;
        this.game_version = game_version;
        this.deps = deps;
        this.parent_locator = parent_locator;
        this.released = released;
        this.is_dependency = is_dependency;
        this.downloads = downloads;
        this.direct_link = direct_link;
        this.prefer_link = prefer_link;
    }

    static create_new(version: string, game_version: string, deps: Array<string>, parent_locator: string, released: number, direct_link: string, prefer_link: boolean) {
        let idx = filedef.get_index();
        let ploc = Locator.from_short_slug(parent_locator);
        let ppkgi = idx.packages.findIndex( (pkg) => {
            return pkg.repository == ploc.repo && pkg.slug == ploc.slug;
        })
        let next_rel_id = idx.packages[ppkgi].releases.length;
        let r = new this(next_rel_id, version, game_version, deps, parent_locator, released, false, 0, direct_link, prefer_link);
        idx.packages[ppkgi].releases.push(r);
        filedef.write(idx, "index");
        return r;
    }
}

export class Package {
    name: string;
    description: string;
    releases: Array<Release>;
    repository: string;
    authors: Array<string>;
    slug: string;
    
    constructor(name: string, description: string, releases: Array<Release>, repository: string, authors: Array<string>, slug: string) {
        this.name = name;
        this.description = description;
        this.releases = releases;
        this.repository = repository;
        this.authors = authors;
        this.slug = slug;
    }

    static create_new(name: string, description: string, authors: Array<string>, releases: Array<Release>, repository: string, slug: string) 
    {
        let p = new this (name, description, releases, repository,authors, slug);
        let idx = filedef.get_index();
        idx.packages.push(p);
        idx.next_pkg_id += 1;
        filedef.write(idx, "index");
        return p;
    }

    get next_release_id() {
        return this.releases.length;
    }
}

export class Repository {
    url: string;
    api_type: number; // 1 for normal, 2 for direct
    
    constructor(url:string, api_type: number) {
        this.url = url;
        this.api_type = api_type;
    }
}

export class Locator {
    // The locator is a unique locator to a specific package version
    // It contains the full URL of the repository, so that it can be resolved even if someone hasn't added that repository
    repo: string;
    slug: string;
    rel_id: number;

    constructor(repo: string, slug: string, rel_id: number) {
        this.repo = repo
        this.slug = slug
        this.rel_id = rel_id
    }

    static from_short_slug(sslug: string) {
        let split = sslug.split("->");
        let rel_id = split.pop();
        let slug = split.pop();
        let repo = split.pop();
        return new this(repo, slug, Number(rel_id))
    }

    get short_slug() {
        return `${this.repo}->${this.slug}->${this.rel_id}`
    }
}


export function locator_to_release(locator: Locator, known_packages: Array<Package>): Release {
    known_packages = known_packages.filter( (pkg) => {return pkg.repository == locator.repo})
    if (known_packages.length == 0) {
        util.print_error(`Repository ${locator.repo} not found`);
        process.exit();
    }
    known_packages = known_packages.filter( (pkg) => {return pkg.slug == locator.slug})
    if (known_packages.length == 0) {
        util.print_error(`Package ${locator.repo}/${locator.slug} not found`);
        process.exit();
    }
    let rel: Release = undefined 
    try {
        rel = known_packages[0].releases[locator.rel_id]
    } catch (err) {
        util.print_error(`Release ${locator.short_slug} not found`)
        process.exit();
    }
    return rel
}

export function locator_to_package(locator: Locator, known_packages: Array<Package>): Package {
    known_packages = known_packages.filter( (pkg) => {return pkg.repository == locator.repo})
    if (known_packages.length == 0) {
        util.print_error(`Repository ${locator.repo} not found`);
        process.exit();
    }
    known_packages = known_packages.filter( (pkg) => {return pkg.slug == locator.slug})
    if (known_packages.length == 0) {
        util.print_error(`Package ${locator.repo}/${locator.slug} not found`);
        process.exit();
    }
    return known_packages[0]
}

export function get_desired_release(pkg: Package, game_version: string, release_version?: string): Release{
    // NOTE: Uses `latest` unless a version is specified
    let options = pkg.releases.filter( (value) => {
        return release_compatible(value.game_version, game_version);
    });
    if(release_version) {
        options = options.filter( (value) => {
            return value.version == release_version
        });
    }

    let newest = options.sort( (a, b) =>{
        return b.released - a.released;
    });
    if(newest.length === 0) {
        util.print_error(`ERROR - package ${pkg.name} for version ${game_version} not found`);
        process.exit();
    }
    return newest[0]
}

export function release_compatible(release1: string, release2: string) {
    let arr1 = release1.split(".");
    let arr2 = release2.split(".");

    return (release1 == release2 || util.arr_eq(arr1.slice(0,2), arr2.slice(0,2)))
}