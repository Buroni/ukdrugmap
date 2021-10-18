module.exports = {
    plugins: [
        ["@babel/plugin-proposal-decorators", {legacy: true}],
    ],
    presets: [
        "@babel/preset-env",
        [
            "@babel/preset-typescript",
            {
                isTSX: true,
                allExtensions: true,
            },
        ],
        "@babel/preset-react",
    ],
    ignore: [
        /mapbox-gl/
    ],
}
