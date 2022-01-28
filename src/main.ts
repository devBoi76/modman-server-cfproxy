import express from "express"
import * as util from "./util"
import * as config from "./config"
import * as cfapi from "./cfapi"
import * as filedef from "./filedef"
const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
    res.send("Hello there")
});

app.get("/v1/get_available_packages", (req, res) => {
    let idx = filedef.get_index().packages
    res.send(JSON.stringify(idx))
})






function main() {
    util.print_debug("Starting server...");
    config.ensure_files()
    cfapi.index_package(74072);
    app.listen(PORT, () => {
        util.print_debug(`Server started at ${PORT}`);
    });
}




main();