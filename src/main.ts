import express from "express"
import * as util from "./util"
import * as config from "./config"
import * as cfapi from "./cfapi"
import * as filedef from "./filedef"
import * as packages from "./package"

const app = express();
export const PORT = 5000;
export const REPOSITORY = `http://localhost:${PORT}`

app.get("/", (req, res) => {
    res.send("Hello there")
});

app.get("/v1/get_available_packages", (req, res) => {
    let idx = filedef.get_index().packages
    res.send(JSON.stringify(idx))
})

app.get("/v1/download_release/:slug/:rel_id", (req, res) => {
    let lloc = packages.Locator.from_short_slug(`${REPOSITORY}->${req.params.slug}->${req.params.rel_id}`)
    let redirect_url = packages.locator_to_release(lloc, filedef.get_index().packages).direct_link;
    res.redirect(redirect_url);
});




function main() {
    util.print_debug("Starting server...");
    config.ensure_files()
    cfapi.index_package(74072);
    app.listen(PORT, () => {
        util.print_debug(`Server started at ${PORT}`);
    });
}




main();