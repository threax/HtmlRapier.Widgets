var compileJavascript = require('threax-gulp-tk/javascript.js');

module.exports = function (rootDir, outDir) {
    compileJavascript({
        libs: [
            __dirname + "/src/**/*.js",
            "!**/*.intellisense.js"
        ],
        output: "HtmlRapierWidgets",
        dest: outDir,
        sourceRoot: __dirname + "/src/",
        minify: true,
        concat: true
    });
}