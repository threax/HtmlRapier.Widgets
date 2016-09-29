jsns.define("hr.widgets.jsonobjecteditor", [
    "hr.toggles",
    "hr.plugins.jdorn.json-editor",
    "hr.promiseutils"
],
function (exports, module, toggles, jsonEditor, promiseUtils) {
    var defaultError = { path: null };

    "use strict"
    /**
     * This is a generic object editor that uses json-editor to edit objects.
     * The ui is determined by the html. This supports a load, main, error
     * lifecycle, but it is controlled externally. It can also be put on a 
     * dialog named 'dialog', which it will activate when required. It also 
     * consideres closing this dialog to be a cancellation and will send its
     * promise with an undefined result, which means cancel the operation.
     */
    function JsonObjectEditor(bindings, context) {
        var currentError = null

        var modeModel = bindings.getModel('mode');
        var titleModel = bindings.getModel('title');
        var errorModel = bindings.getModel('error');
        var formModel = new jsonEditor.create(bindings.getHandle("editorHolder"), {
            schema: context.schema,
            disable_edit_json: true,
            disable_properties: true,
            disable_collapse: true,
            show_errors: "always",
            custom_validators: [
                showCurrentErrorValidator
            ]
        });
        var formEditor = formModel.getEditor();

        var dialog = bindings.getToggle('dialog');
        dialog.offEvent.add(this, closed);

        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var error = bindings.getToggle('error');
        var formToggles = new toggles.Group(load, main, error);
        formToggles.activate(main);

        var currentPromise = null;

        function edit(data) {
            currentPromise = new promiseUtils.External();
            titleModel.setData(data);
            modeModel.setData("Edit");
            formModel.setData(data);
            return currentPromise.promise;
        }
        this.edit = edit;
        context.edit = edit;

        function getData() {
            return formModel.getData();
        }
        context.getData = getData;

        function submit(evt) {
            evt.preventDefault();
            if (currentPromise !== null) {
                var data = getData();
                var prom = currentPromise;
                currentPromise = null;
                prom.resolve(data);
            }
        }
        this.submit = submit;

        function closed() {
            if (currentPromise !== null) {
                var prom = currentPromise;
                currentPromise = null;
                prom.resolve();
            }
        }

        context.showMain = function () {
            formToggles.activate(main);
        }

        context.showLoad = function () {
            formToggles.activate(load);
        }

        context.showError = function (err) {
            var errorMessage = "No error message";
            if (err.message !== undefined) {
                errorMessage = err.message;
            }
            errorModel.setData(errorMessage);
            formToggles.activate(error);
            currentError = err;
            formEditor.onChange();
            main.on();
        }

        context.clearError = function () {
            currentError = null;
            formEditor.onChange();
            formToggles.activate(main);
            errorModel.clear();
        }

        context.show = function () {
            dialog.on();
        }

        context.close = function () {
            dialog.off();
        }

        function showCurrentErrorValidator(schema, value, path) {
            if (currentError !== null) {
                if (path === "root") {
                    return {
                        path: path,
                        message: currentError.message
                    }
                }

                if (currentError['errors'] !== undefined) {
                    //walk path to error
                    var shortPath = errorPath(path);
                    var errorObject = currentError.errors[shortPath];
                    if (errorObject !== undefined) {
                        return {
                            path: path,
                            message: errorObject
                        };
                    }
                }
            }
            return defaultError;
        }

        function errorPath(path) {
            return path.replace('root.', '');
        }
    }

    module.exports = JsonObjectEditor;
});