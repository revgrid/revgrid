// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: [
        path.resolve(__dirname, "styles.css"),
        path.resolve(__dirname, "index.ts"),
    ],

    output: {
        filename: '[name].bundle.js',
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        "configFile": "./tsconfig.json",
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "index.html"),
        }),
    ],

    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000,
    },
};
