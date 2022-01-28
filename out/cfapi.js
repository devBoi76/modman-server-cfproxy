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
exports.index_package = exports.add_pkg_to_tracked = exports.get_package = exports.get_releases = void 0;
const packages = __importStar(require("./package"));
const util = __importStar(require("./util"));
const filedef = __importStar(require("./filedef"));
// All of this is based on https://github.com/Mondanzo/mc-curseforge-api
const BASE_URL = "https://addons-ecs.forgesvc.net/api/v2/addon";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0";
const REPOSITORY = "https://curseforge.com";
class CfRelease {
}
class CfPackage {
}
let cf_package_cache = new Map();
let cf_release_cache = new Map();
function get_releases(cf_id) {
    if (cf_release_cache.has(cf_id)) {
        return cf_release_cache.get(cf_id);
    }
    let resp = util.get_sync(`${BASE_URL}/${cf_id}/files`);
    let tmp = JSON.parse(resp);
    cf_release_cache.set(cf_id, tmp);
    return tmp;
}
exports.get_releases = get_releases;
function get_package(cf_id) {
    if (cf_package_cache.has(cf_id)) {
        return cf_package_cache.get(cf_id);
    }
    let resp = util.get_sync(`${BASE_URL}/${cf_id}`);
    let tmp = JSON.parse(resp);
    cf_package_cache.set(cf_id, tmp);
    return tmp;
}
exports.get_package = get_package;
function add_pkg_to_tracked(cf_id, sslug) {
}
exports.add_pkg_to_tracked = add_pkg_to_tracked;
// TODO: Cache curseforge api responses
function index_package(id_to_add) {
    var _a;
    // Step one: build a dependency tree
    let dependency_tree = new Map();
    let ids_to_do = [id_to_add];
    let resolved_ids = new Set();
    while (true) {
        if (ids_to_do.length == 0) {
            break;
        }
        let current_id = ids_to_do.pop();
        let releases = get_releases(current_id);
        for (const release of releases) {
            for (const dependency of release.dependencies) {
                switch (dependency.type) {
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
                            tmp = new Set();
                        }
                        util.print_debug(tmp);
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
        let tmp = (_a = dependency_tree.get(current_id)) !== null && _a !== void 0 ? _a : new Set();
        for (const dependency of tmp.values()) {
            ids_to_do.push(dependency);
            ordered = ordered.filter((id) => id != dependency);
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
        let authors = pkg.authors.map((author) => author.name);
        let p = packages.Package.create_new(pkg.name, pkg.summary, authors, [], REPOSITORY, pkg.slug);
        packages.TrackedPackage.mark_updated(pkg.id, p.slug);
        for (const release of releases) {
            let loader = "Forge";
            if (release.gameVersion.includes("Fabric")) {
                loader = "Fabric";
            }
            release.gameVersion = release.gameVersion.filter((str) => str != "Fabric" && str != "Forge");
            if (release.gameVersion.length == 0) {
                util.print_debug(`Game version for ${release.displayName} id ${release.id} not found, skipping`);
                continue;
            }
            let dependencies = new Array(); // sslugs
            for (const dependency of release.dependencies) {
                let ppkg = get_package(dependency.addonId);
                let ppkg_loc = packages.Locator.from_short_slug(`${REPOSITORY}->${ppkg.slug}->0`);
                let local_pkg = packages.locator_to_package(ppkg_loc, filedef.get_index().packages);
                let rel_id = packages.get_desired_release(local_pkg, release.gameVersion[0]).id;
                let slug = new packages.Locator(REPOSITORY, local_pkg.slug, rel_id);
                dependencies.push(slug.short_slug);
            }
            let r_id = p.next_release_id;
            let r = packages.Release.create_new("unknown", release.gameVersion[0], dependencies, `${p.repository}->${p.slug}->${r_id}`, Date.parse(release.fileDate), release.downloadUrl, true);
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
exports.index_package = index_package;
//# sourceMappingURL=cfapi.js.map