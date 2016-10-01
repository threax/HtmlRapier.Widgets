var compileTypescript = require('threax-gulp-tk/typescript.js');

module.exports = function (rootDir, outDir) {
    return compileTypescript({
        libs: [
            __dirname + "/src/**/*.ts",
        ],
        runners: [
            
        ],
        output: "HtmlRapierWidgets",
        dest: outDir,
        sourceRoot: __dirname + "/src/",
        concat: true
    });
}