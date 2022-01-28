import * as packages from "./package"
import * as util from "./util"
import * as filedef from "./filedef"

// All of this is based on https://github.com/Mondanzo/mc-curseforge-api
const BASE_URL = "https://addons-ecs.forgesvc.net/api/v2/addon"
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0"
const REPOSITORY = "https://curseforge.com"

class CfRelease {
    id: number;
    displayName: string;
    fileName: string;
    fileDate: string;
    fileLength: number;
    releaseType: number;
    fileStatus: number;
    downloadUrl: string;
    isAlternate: boolean;
    alternateFieldId: number;
    dependencies: Array<{addonId: number; type: number;}>;
    isAvailable: boolean;
    modules: Array<{foldername: string; fingerprint: number;}>;
    packageFingerprint: number;
    gameVersion: Array<string>;
    installMetadata: boolean;
    serverPackFileId: boolean;
    hasInstallScript: boolean;
    gameVersionDateReleased: string;
    gameVersionFlavor: boolean;
}

class CfPackage {
    id: number;
    name: string;
    authors: Array<{name: string; url: string;}>;
    summary: string;
    slug: string;
    modLoaders: Array<string>;
    dateModified: string;
}

let cf_package_cache = new Map<number, CfPackage>();
let cf_release_cache = new Map<number, Array<CfRelease>>();

export function get_releases(cf_id: number): Array<CfRelease> {
    if (cf_release_cache.has(cf_id)) {
        return cf_release_cache.get(cf_id)
    }
    let resp = util.get_sync(`${BASE_URL}/${cf_id}/files`);
    let tmp = JSON.parse(resp);
    cf_release_cache.set(cf_id, tmp);
    return tmp;
}

export function get_package(cf_id: number): CfPackage {
    if (cf_package_cache.has(cf_id)) {
        return cf_package_cache.get(cf_id);
    }
    let resp = util.get_sync(`${BASE_URL}/${cf_id}`);
    let tmp = JSON.parse(resp);
    cf_package_cache.set(cf_id, tmp);
    return tmp;
}

export function add_pkg_to_tracked(cf_id: number, sslug: string) {

}

// TODO: Cache curseforge api responses
export function index_package(id_to_add: number) {
    // Step one: build a dependency tree
    let dependency_tree = new Map<number, Set<number>>();
    let ids_to_do = [id_to_add];
    let resolved_ids = new Set<number>();
    while (true) {
        if (ids_to_do.length == 0) {
            break;
        }
        let current_id = ids_to_do.pop();

        let releases = get_releases(current_id);

        for (const release of releases) {
            for (const dependency of release.dependencies) {


                switch(dependency.type) {
                    case 1:
                    case 2:
                    case 5:
                        break;
                    case 6:
                    case 3:
                        // required
                        if (!resolved_ids.has(dependency.addonId)) {
                            ids_to_do.push(dependency.addonId);
                        }
                        let tmp = dependency_tree.get(current_id);
                        if (tmp === undefined) {
                           tmp = new Set<number>() 
                        }
                        util.print_debug(tmp)
                        tmp.add(dependency.addonId);
                        dependency_tree.set(current_id, tmp);
                        break;
                    case 4:
                        util.print_debug(`Encountered 'Tool' (4) dependency type for ${current_id} release ${release.displayName} - skipping`);
                        break;
                    
                    default:
                        util.print_debug(`Encountered  (${dependency.type}) dependency type for ${current_id} release ${release.displayName} - skipping. Should be unreachable`);
                        break;
                }
                resolved_ids.add(dependency.addonId);
                
            }
        }
    }

    // At this point all the resolved IDs and a dependency tree
    // Get the correct order

    ids_to_do = [id_to_add];
    let ordered = [id_to_add]; // always end with the root package

    while (true) {
        if (ids_to_do.length == 0) {
            break;
        }
        util.print_debug(ordered);
        let current_id = ids_to_do.pop();
        let tmp = dependency_tree.get(current_id) ?? new Set<number>();
        for (const dependency of tmp.values()) {
            ids_to_do.push(dependency);
            ordered = ordered.filter( (id) => id != dependency);
            ordered.push(dependency);
        }
    }
    util.print_debug(`Final order: ${ordered}`);

    while (true) {
        if (ordered.length == 0) {
            break;
        }
        let current_id = ordered.pop();
        util.print_debug(`Installing ${current_id}`);

        let pkg = get_package(current_id);
        let releases = get_releases(current_id);
        util.print_debug(`${releases.length} releases`);
        let authors = pkg.authors.map( (author) => author.name);

        let p = packages.Package.create_new(pkg.name, pkg.summary, authors, [], REPOSITORY, pkg.slug)

        packages.TrackedPackage.mark_updated(pkg.id, p.slug);
        for (const release of releases) {
            let loader = "Forge";
            if (release.gameVersion.includes("Fabric")) {
                loader = "Fabric";
            }
            release.gameVersion = release.gameVersion.filter( (str) => str != "Fabric" && str != "Forge")

            if (release.gameVersion.length == 0) {
                util.print_debug(`Game version for ${release.displayName} id ${release.id} not found, skipping`);
                continue;
            }
            let dependencies = new Array<string>(); // sslugs
            for (const dependency of release.dependencies) {
                let ppkg = get_package(dependency.addonId);
                let ppkg_loc = packages.Locator.from_short_slug(`${REPOSITORY}->${ppkg.slug}->0`)
                let local_pkg = packages.locator_to_package(ppkg_loc, filedef.get_index().packages);
                let rel_id = packages.get_desired_release(local_pkg, release.gameVersion[0]).id;
                let slug = new packages.Locator(REPOSITORY, local_pkg.slug, rel_id);
                dependencies.push(slug.short_slug);
            }
            let r_id = p.next_release_id;
            let r = packages.Release.create_new(
                "unknown", 
                release.gameVersion[0],
                dependencies, 
                `${p.repository}->${p.slug}->${r_id}`, 
                Date.parse(release.fileDate), 
                release.downloadUrl, true
            );
        }

    }
    // to_add.add(id_to_add);
    // for (const cf_id of to_add) {
    //     let pkg = get_package(cf_id);
    //     // create new package, add it to tracked and index
    //     let p = packages.Package.create_new(pkg.name, pkg.summary,pkg.authors.map( (author) => {return author.name}), [], REPOSITORY, pkg.slug)

    //     packages.TrackedPackage.mark_updated(cf_id, p.slug);
        
    //     // index the releases and get all dependencies in order in which they should be installed
    //     const releases = get_releases(cf_id);
        
    //     for (const release of releases) {
    //         let deps = [];
    //         let loader = "Forge";
    //         if (release.gameVersion.includes("Fabric")) {
    //             loader = "Fabric";
    //         }
    //         release.gameVersion = release.gameVersion.filter( (str) => str != "Fabric" && str != "Forge")

              
    //     }
        
        
    // }

}