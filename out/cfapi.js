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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawl_cf = exports.index_package = exports.get_page = exports.get_package = exports.get_releases = void 0;
const packages = __importStar(require("./package"));
const util = __importStar(require("./util"));
const filedef = __importStar(require("./filedef"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const main_1 = require("./main");
// All of this is based on https://github.com/Mondanzo/mc-curseforge-api
const BASE_URL = "https://addons-ecs.forgesvc.net/api/v2/addon";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0";
class CfRelease {
}
class CfPackage {
}
let cf_package_cache = new Map();
let cf_release_cache = new Map();
function get_releases(cf_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cf_release_cache.has(cf_id)) {
            util.print_debug(`Cache hit for releases of ${cf_id}`);
            return cf_release_cache.get(cf_id);
        }
        let resp = undefined;
        let tmp = undefined;
        while (true) {
            resp = yield node_fetch_1.default(`${BASE_URL}/${cf_id}/files`);
            try {
                tmp = yield resp.json();
                break;
            }
            catch (err) {
                util.print_debug("Could not get release, retrying");
                continue;
            }
        }
        // console.log(tmp);
        cf_release_cache.set(cf_id, tmp);
        return tmp;
    });
}
exports.get_releases = get_releases;
function get_package(cf_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cf_package_cache.has(cf_id)) {
            util.print_debug(`Cache hit for package of ${cf_id}`);
            return cf_package_cache.get(cf_id);
        }
        let resp = undefined;
        let tmp = undefined;
        while (true) {
            resp = yield node_fetch_1.default(`${BASE_URL}/${cf_id}`);
            try {
                tmp = yield resp.json();
                break;
            }
            catch (err) {
                util.print_debug("Could not get release, retrying");
                continue;
            }
        }
        // console.log(tmp);
        cf_package_cache.set(cf_id, tmp);
        return tmp;
    });
}
exports.get_package = get_package;
function get_page(page, PAGE_SIZE) {
    let resp = util.get_sync(`${BASE_URL}/search?gameId=432&sectionId=6&index=${page}&pageSize=${PAGE_SIZE !== null && PAGE_SIZE !== void 0 ? PAGE_SIZE : 5}`);
    let tmp = JSON.parse(resp);
    // cache
    for (const pkg of tmp) {
        if (!cf_package_cache.has(pkg.id)) {
            cf_package_cache.set(pkg.id, pkg);
        }
    }
    return tmp;
}
exports.get_page = get_page;
function index_package(id_to_add) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Step one: build a dependency tree
        let dependency_tree = new Map();
        let ids_to_do = [id_to_add];
        let resolved_ids = new Set();
        while (true) {
            if (ids_to_do.length == 0) {
                break;
            }
            let current_id = ids_to_do.pop();
            let releases = yield get_releases(current_id);
            for (const release of releases) {
                for (const dependency of release.dependencies) {
                    switch (dependency.type) {
                        case 2:
                            util.print_debug(`Encountered  (${dependency.type}) dependency type for ${current_id} release ${release.displayName} - skipping`);
                            break;
                        case 5:
                            util.print_debug(`Encountered  (${dependency.type}) dependency type for ${current_id} release ${release.displayName} - skipping`);
                            break;
                        case 6:
                        case 4:
                        case 3:
                        case 1:
                            // required
                            if (!resolved_ids.has(dependency.addonId)) {
                                ids_to_do.push(dependency.addonId);
                            }
                            let tmp = dependency_tree.get(current_id);
                            if (tmp === undefined) {
                                tmp = new Set();
                            }
                            tmp.add(dependency.addonId);
                            dependency_tree.set(current_id, tmp);
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
            let pkg = yield get_package(current_id);
            let releases = yield get_releases(current_id);
            if (filedef.get_tracked().packages.map((p) => p.slug).includes(pkg.slug)) {
                util.print_debug(`Package ${pkg.name} already installed, skipping`);
                continue;
            }
            util.print_debug(`${releases.length} releases`);
            let authors = pkg.authors.map((author) => author.name);
            let p = packages.Package.create_new(pkg.name, pkg.summary, authors, [], main_1.REPOSITORY, pkg.slug);
            packages.TrackedPackage.mark_updated(pkg.id, p.slug);
            let r_id = 0;
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
                    util.print_debug(`Resolving dependencies of ${release.displayName}`);
                    if (dependency.type == 2 || dependency.type == 5) {
                        continue;
                    }
                    console.log(dependency);
                    let ppkg = yield get_package(dependency.addonId);
                    let ppkg_loc = packages.Locator.from_short_slug(`${main_1.REPOSITORY}->${ppkg.slug}->0`);
                    let local_pkg = packages.locator_to_package(ppkg_loc, filedef.get_index().packages);
                    let rel_id = packages.get_desired_release(local_pkg, release.gameVersion[0]).id;
                    let slug = new packages.Locator(main_1.REPOSITORY, local_pkg.slug, rel_id);
                    dependencies.push(slug.short_slug);
                }
                let r = packages.Release.create_new("unknown", release.gameVersion[0], dependencies, `${p.repository}->${p.slug}->${r_id}`, Date.parse(release.fileDate), release.downloadUrl.replace("https://edge.", "https://media."), true);
                r_id += 1;
            }
        }
    });
}
exports.index_package = index_package;
function crawl_cf(start_page) {
    return __awaiter(this, void 0, void 0, function* () {
        const PAGE_SIZE = 5;
        let page = start_page;
        while (true) {
            let to_add = get_page(page, PAGE_SIZE);
            for (const pkg of to_add) {
                yield index_package(pkg.id);
            }
            page += 1;
        }
    });
}
exports.crawl_cf = crawl_cf;
//# sourceMappingURL=cfapi.js.map