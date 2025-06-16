const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
    output: {
        path: path.resolve(__dirname, '../../docs/Examples/Record_Test/app'),
    },

    mode: 'production',
    devtool: 'source-map',
});
