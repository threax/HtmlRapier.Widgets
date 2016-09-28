var bootstrapNativeBuild = require(__dirname + '/src/plugin/bootstrap.native/build');
var jsonEditorBuild = require(__dirname + '/src/plugin/json-editor/build');
var swaggerJsBuild = require(__dirname + '/src/plugin/swagger-js/build');
var ez = require('gulp-build-shortcuts');

module.exports = function (rootDir, outDir) {
    swaggerJsBuild(rootDir + '/node_modules/swagger-client/');
    jsonEditorBuild(rootDir + '/node_modules/json-editor/');
    bootstrapNativeBuild(rootDir + "/node_modules/bootstrap.native/lib/");

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
        dest: outDir + "/HtmlRapier/",
        sourceRoot: __dirname + "/custom_components/HtmlRapierWidgets/src/"
    });
}