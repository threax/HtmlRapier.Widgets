var ez = require('gulp-build-shortcuts');

module.exports = function (rootDir, outDir) {
    ez.minifyConcat({
        libs: [
            __dirname + "/src/**/*.js",
            "!**/*.intellisense.js"
        ],
        output: "HtmlRapierWidgets",
        dest: outDir,
        sourceRoot: __dirname + "/custom_components/HtmlRapierWidgets/src/"
    });
}