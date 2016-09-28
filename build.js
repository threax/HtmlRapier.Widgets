var ez = require('gulp-build-shortcuts');

module.exports = function (rootDir, outDir) {
    ez.minifyConcat({
        libs: [
            __dirname + "/src/data/**/*.js",
            __dirname + "/src/widgets/**/*.js",
            __dirname + "/src/plugin/bootstrap.native/modules/**/*.js",
            __dirname + "/src/plugin/json-editor/modules/**/*.js",
            __dirname + "/src/plugin/swagger-js/modules/**/*.js",
            "!**/*.intellisense.js"
        ],
        output: "HtmlRapierWidgets",
        dest: outDir,
        sourceRoot: __dirname + "/custom_components/HtmlRapierWidgets/src/"
    });
}