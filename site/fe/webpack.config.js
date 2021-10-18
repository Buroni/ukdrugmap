/* global process:true */
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const DotEnv = require("dotenv-webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const plugins = [
    new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css",
    }),
    new DotEnv(),
];

const rules = [
    {
        test: /\.(sa|sc|c)ss$/,
        use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "postcss-loader",
            "sass-loader",
        ],
    },
    {
        test: /\.tsx?$/,
        use: "babel-loader",
        exclude: "/node_modules/",
    },
    {
        test: /\.js$/,
        use: [
            {
                loader: "babel-loader",
            },
        ],
        exclude: "/node_modules/",
    },
    {
        test: /\.(woff(2)?|ttf|eot|svg)$/,
        use: [
            {
                loader: "file-loader",
                options: {
                    name: "[name].[ext]",
                    outputPath: "fonts/",
                },
            },
        ],
    },
];

module.exports = {
    plugins,
    entry: {
        base: "./src/base.ts",
    },
    output: {
        publicPath: "/static/",
        filename: "[name].js",
        library: ["LIB", "[name]"],
        libraryExport: "default",
    },
    module: {
        rules,
    },
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        fallback: { 
            "os": require.resolve("os-browserify/browser"),
            "path": require.resolve("path-browserify"),
            "fs": false,
         },
    },
};
