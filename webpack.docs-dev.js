const path = require("path");

module.exports = {
    mode: "none",
    entry: {},
    devServer: {
        static: {
            directory: path.join(__dirname, "docs"),
            publicPath: "/revgrid",
        },

        port: 3001,
    },
};
