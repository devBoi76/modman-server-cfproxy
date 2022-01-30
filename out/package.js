"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.release_compatible = exports.get_desired_release = exports.locator_to_package = exports.locator_to_release = exports.Locator = exports.Repository = exports.Package = exports.Release = exports.TrackedPackage = void 0;
const util = __importStar(require("./util"));
const filedef = __importStar(require("./filedef"));
class TrackedPackage {
    constructor(cf_id, slug, last_modified) {
        this.cf_id = cf_id;
        this.slug = slug;
        this.last_modified = last_modified;
    }
    static mark_updated(cf_id, slug) {
        let tracked = filedef.get_tracked();
        if (!tracked.cf_ids.includes(cf_id)) {
            tracked.cf_ids.push(cf_id);
        }
        if (!tracked.packages.map((pkg) => { return pkg.cf_id; }).includes(cf_id)) {
            let t = new this(cf_id, slug, Date.now());
            tracked.packages.push(t);
        }
        else {
            let ti = tracked.packages.findIndex((pkg) => { return pkg.cf_id == cf_id; });
            tracked.packages[ti].last_modified = Date.now();
        }
        filedef.write(tracked, "tracked");
    }
}
exports.TrackedPackage = TrackedPackage;
class Release {
    constructor(id, version, game_version, deps, parent_locator, released, is_dependency, downloads, direct_link, prefer_link) {
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
    static create_new(version, game_version, deps, parent_locator, released, direct_link, prefer_link) {
        let idx = filedef.get_index();
        let ploc = Locator.from_short_slug(parent_locator);
        let ppkgi = idx.packages.findIndex((pkg) => {
            return pkg.repository == ploc.repo && pkg.slug == ploc.slug;
        });
        let next_rel_id = idx.packages[ppkgi].releases.length;
        let r = new this(next_rel_id, version, game_version, deps, parent_locator, released, false, 0, direct_link, prefer_link);
        idx.packages[ppkgi].releases.push(r);
        filedef.write(idx, "index");
        return r;
    }
}
exports.Release = Release;
class Package {
    constructor(name, description, releases, repository, authors, slug) {
        this.name = name;
        this.description = description;
        this.releases = releases;
        this.repository = repository;
        this.authors = authors;
        this.slug = slug;
    }
    static create_new(name, description, authors, releases, repository, slug) {
        let p = new this(name, description, releases, repository, authors, slug);
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
exports.Package = Package;
class Repository {
    constructor(url, api_type) {
        this.url = url;
        this.api_type = api_type;
    }
}
exports.Repository = Repository;
class Locator {
    constructor(repo, slug, rel_id) {
        this.repo = repo;
        this.slug = slug;
        this.rel_id = rel_id;
    }
    static from_short_slug(sslug) {
        let split = sslug.split("->");
        let rel_id = split.pop();
        let slug = split.pop();
        let repo = split.pop();
        return new this(repo, slug, Number(rel_id));
    }
    get short_slug() {
        return `${this.repo}->${this.slug}->${this.rel_id}`;
    }
}
exports.Locator = Locator;
function locator_to_release(locator, known_packages) {
    known_packages = known_packages.filter((pkg) => { return pkg.repository == locator.repo; });
    if (known_packages.length == 0) {
        util.print_error(`Repository ${locator.repo} not found`);
        util.print_note(`Was looking for ${locator.slug}->${locator.rel_id} (Release)`);
        process.exit();
    }
    known_packages = known_packages.filter((pkg) => { return pkg.slug == locator.slug; });
    if (known_packages.length == 0) {
        util.print_error(`Package ${locator.repo}->${locator.slug} not found (Release)`);
        process.exit();
    }
    let rel = undefined;
    try {
        rel = known_packages[0].releases[locator.rel_id];
    }
    catch (err) {
        util.print_error(`Release ${locator.short_slug} not found (Release)`);
        process.exit();
    }
    return rel;
}
exports.locator_to_release = locator_to_release;
function locator_to_package(locator, known_packages) {
    known_packages = known_packages.filter((pkg) => { return pkg.repository == locator.repo; });
    if (known_packages.length == 0) {
        util.print_error(`Repository ${locator.repo} not found`);
        util.print_note(`Was looking for ${locator.short_slug} (Package)`);
        process.exit();
    }
    known_packages = known_packages.filter((pkg) => { return pkg.slug == locator.slug; });
    if (known_packages.length == 0) {
        util.print_error(`Package ${locator.repo}->${locator.slug} not found (Package)`);
        process.exit();
    }
    return known_packages[0];
}
exports.locator_to_package = locator_to_package;
function get_desired_release(pkg, game_version, release_version) {
    // NOTE: Uses `latest` unless a version is specified
    let options = pkg.releases.filter((value) => {
        return release_compatible(value.game_version, game_version);
    });
    if (release_version) {
        options = options.filter((value) => {
            return value.version == release_version;
        });
    }
    let newest = options.sort((a, b) => {
        return b.released - a.released;
    });
    if (newest.length === 0) {
        util.print_note(`Package ${pkg.name} for version ${game_version} not found`);
        util.print_note(`Using latest release`);
        newest = pkg.releases.sort((a, b) => {
            return b.released - a.released;
        });
    }
    return newest[0];
}
exports.get_desired_release = get_desired_release;
function release_compatible(release1, release2) {
    let arr1 = release1.split(".");
    let arr2 = release2.split(".");
    return (release1 == release2 || util.arr_eq(arr1.slice(0, 2), arr2.slice(0, 2)));
}
exports.release_compatible = release_compatible;
//# sourceMappingURL=package.js.map