var jsnsModuleify = require('gulp-jsns-module');

function compile(sourceDir, destDir) {
    quickModule('thednp.bootstrap.native.affix', "affix-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.alert', "alert-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.button', "button-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.carousel', "carousel-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.collapse', "collapse-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.dropdown', "dropdown-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.modal', "modal-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.popover', "popover-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.scrollspy', "scrollspy-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.tab', "tab-native.js", sourceDir);
    quickModule('thednp.bootstrap.native.tooltip', "tooltip-native.js", sourceDir);
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