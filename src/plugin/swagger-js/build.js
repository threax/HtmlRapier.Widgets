var jsnsModuleify = require('gulp-jsns-module');

function compile(sourceDir) {
    quickModule('swaggerapi.swaggerclient', "browser/swagger-client.js", sourceDir);
}

function quickModule(moduleName, sourceFile, sourceDir) {
    jsnsModuleify({
        moduleName: moduleName,
        libs: [
            sourceDir + sourceFile,
            "!" + sourceDir + "**/*.intellisense.js"
        ],
        output: sourceFile,
        dest: __dirname + "/modules/",
        sourceRoot: sourceDir,
    });
}

module.exports = compile;