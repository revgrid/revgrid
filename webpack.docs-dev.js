const { watch, watchFile } = require("fs");
const path = require("path");

module.exports = {
    mode: "none",
    entry: {},
    devServer: {
        static: {
            directory: path.join(__dirname, "docs"),
        },
        port: 3001,
        watchFiles: {
            paths: ["docs/**/*"],
        }
    },
};
