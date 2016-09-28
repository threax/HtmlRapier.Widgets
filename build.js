var ez = require('gulp-build-shortcuts');

module.exports = function (rootDir, outDir) {
    ez.minifyConcat({
        libs: [
            "./custom_components/HtmlRapierWidgets/src/data/**/*.js",
            "./custom_components/HtmlRapierWidgets/src/widgets/**/*.js",
            "./custom_components/HtmlRapierWidgets/src/plugin/bootstrap.native/modules/**/*.js",
            "./custom_components/HtmlRapierWidgets/src/plugin/json-editor/modules/**/*.js",
            "./custom_components/HtmlRapierWidgets/src/plugin/swagger-js/modules/**/*.js",
            "!**/*.intellisense.js"
        ],
        output: "HtmlRapierWidgets",
        dest: outDir,
        sourceRoot: __dirname + "/custom_components/HtmlRapierWidgets/src/"
    });
}