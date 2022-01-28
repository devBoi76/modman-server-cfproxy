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
exports.get_conf = exports.conf = exports.get_tracked = exports.tracked = exports.write = exports.get_index = exports.index = void 0;
const fs = __importStar(require("fs"));
class index {
    constructor() {
        this.next_pkg_id = 0;
        this.packages = [];
    }
}
exports.index = index;
function get_index() {
    let f = fs.readFileSync("./assets/pkg_index.json", "utf-8");
    return JSON.parse(f);
}
exports.get_index = get_index;
function write(file, name) {
    switch (name) {
        case "index":
            fs.writeFileSync("./assets/pkg_index.json", JSON.stringify(file));
            break;
        case "tracked":
            fs.writeFileSync("./assets/pkgs_to_track.json", JSON.stringify(file));
            break;
        case "conf":
            fs.writeFileSync("./assets/conf.json", JSON.stringify(file));
            break;
    }
}
exports.write = write;
class tracked {
    constructor() {
        this.cf_ids = [];
        this.packages = [];
    }
}
exports.tracked = tracked;
function get_tracked() {
    let f = fs.readFileSync("./assets/pkgs_to_track.json", "utf-8");
    return JSON.parse(f);
}
exports.get_tracked = get_tracked;
class conf {
    constructor() {
        this.api_type = 1;
        this.name = "My mod repository";
    }
}
exports.conf = conf;
function get_conf() {
    let f = fs.readFileSync("./assets/conf.json", "utf-8");
    return JSON.parse(f);
}
exports.get_conf = get_conf;
//# sourceMappingURL=filedef.js.map