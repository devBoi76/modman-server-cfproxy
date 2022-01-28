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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPOSITORY = exports.PORT = void 0;
const express_1 = __importDefault(require("express"));
const util = __importStar(require("./util"));
const config = __importStar(require("./config"));
const cfapi = __importStar(require("./cfapi"));
const filedef = __importStar(require("./filedef"));
const packages = __importStar(require("./package"));
const app = express_1.default();
exports.PORT = 5000;
exports.REPOSITORY = `http://localhost:${exports.PORT}`;
app.get("/", (req, res) => {
    res.send("Hello there");
});
app.get("/v1/get_available_packages", (req, res) => {
    let idx = filedef.get_index().packages;
    res.send(JSON.stringify(idx));
});
app.get("/v1/download_release/:slug/:rel_id", (req, res) => {
    let lloc = packages.Locator.from_short_slug(`${exports.REPOSITORY}->${req.params.slug}->${req.params.rel_id}`);
    let redirect_url = packages.locator_to_release(lloc, filedef.get_index().packages).direct_link;
    res.redirect(redirect_url);
});
function main() {
    util.print_debug("Starting server...");
    config.ensure_files();
    cfapi.index_package(74072);
    app.listen(exports.PORT, () => {
        util.print_debug(`Server started at ${exports.PORT}`);
    });
}
main();
//# sourceMappingURL=main.js.map