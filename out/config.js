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
exports.ensure_files = void 0;
const filedef = __importStar(require("./filedef"));
const fs = __importStar(require("fs"));
function ensure_files() {
    if (!fs.existsSync("./assets")) {
        fs.mkdirSync("./assets");
    }
    if (!fs.existsSync("./assets/conf.json")) {
        fs.writeFileSync("./assets/conf.json", JSON.stringify(new filedef.Config()));
    }
    if (!fs.existsSync("./assets/pkg_index.json")) {
        fs.writeFileSync("./assets/pkg_index.json", JSON.stringify(new filedef.Index()));
    }
    if (!fs.existsSync("./assets/pkgs_to_track.json")) {
        fs.writeFileSync("./assets/pkgs_to_track.json", JSON.stringify(new filedef.Tracked()));
    }
}
exports.ensure_files = ensure_files;
//# sourceMappingURL=config.js.map