const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',

    output: {
        path: path.resolve(__dirname, 'dist/'),
    },

    // devtool: 'cheap-module-source-map',
    devtool: 'inline-source-map',

    devServer: {
        port: 3001,
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],

            }
        ]
    },
});
