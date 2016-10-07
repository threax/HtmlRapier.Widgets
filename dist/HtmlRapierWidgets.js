jsns.amd("hr.widgets.crudpage", function(define) {

define(["require", "exports", 'hr.controller', 'hr.widgets.jsonobjecteditor', 'hr.widgets.editableitemslist', 'hr.widgets.editableitem', 'hr.widgets.prompt'], function (require, exports, controller, hr_widgets_jsonobjecteditor_1, hr_widgets_editableitemslist_1, hr_widgets_editableitem_1, prompt) {
    "use strict";
    /**
     * This is a shortcut to create a page to create, read, update and delete a type of
     * data provided by a service. A model of the data is used to construct an editor
     * automatically from elements on the page.
     * @param {type} settings
     */
    function CrudPage(settings) {
        var listingActions = settings['listingActions'];
        if (listingActions === undefined) {
            listingActions = {};
        }
        listingActions.edit = function (item) {
            return edit(item, settings.update);
        };
        listingActions.del = deleteItem;
        var deletePrompt = settings['deletePrompt'];
        if (deletePrompt === undefined) {
            deletePrompt = new prompt.BrowserPrompt();
        }
        var listingContext = {
            itemControllerConstructor: hr_widgets_editableitem_1.EditableItem,
            itemControllerContext: listingActions,
            getData: settings.list,
            add: function () {
                return edit(null, settings.create);
            }
        };
        controller.create(settings.listController, hr_widgets_editableitemslist_1.EditableItemsListController, listingContext);
        var editorContext = {
            schema: settings.schema
        };
        controller.create(settings.itemEditorController, hr_widgets_jsonobjecteditor_1.JsonObjectEditor, editorContext);
        function refreshData() {
            listingContext.showLoad();
            return Promise.resolve(settings.list())
                .then(function (data) {
                listingContext.setData(data);
                listingContext.showMain();
            })
                .catch(function (err) {
                listingContext.showError();
                throw err;
            });
        }
        this.refreshData = refreshData;
        function deleteItem(item) {
            return deletePrompt.prompt("Delete " + item.name + " ?")
                .then(function (result) {
                if (result) {
                    listingContext.showLoad();
                    return settings.del(item)
                        .then(function (data) {
                        return refreshData();
                    });
                }
            });
        }
        function edit(data, persistFunc) {
            editorContext.showLoad();
            editorContext.show();
            editorContext.clearError();
            return Promise.resolve(data)
                .then(function (data) {
                editorContext.showMain();
                return goEdit(data, persistFunc);
            });
        }
        this.edit = edit;
        function goEdit(data, persistFunc) {
            return editorContext.edit(data)
                .then(function (data) {
                if (data !== undefined) {
                    editorContext.showLoad();
                    if (persistFunc === undefined) {
                        throw new Error("Cannot save updates to item, no persistFunc given.");
                    }
                    return Promise.resolve(persistFunc(data))
                        .then(function (data) {
                        editorContext.close();
                        refreshData();
                    })
                        .catch(function (err) {
                        editorContext.showError(err);
                        var modifiedData = editorContext.getData();
                        goEdit(modifiedData, persistFunc);
                        throw err;
                    });
                }
            });
        }
    }
    exports.CrudPage = CrudPage;
    ;
});
});
jsns.amd("hr.widgets.editableitem", function(define) {

define(["require", "exports", 'hr.typeidentifiers'], function (require, exports, typeId) {
    "use strict";
    function EditableItem(bindings, context, data) {
        var self = this;
        for (var key in context) {
            if (typeId.isFunction(context[key])) {
                self[key] = (function (evtName) {
                    return function (evt) {
                        evt.preventDefault();
                        context[evtName](data);
                    };
                })(key);
            }
        }
    }
    exports.EditableItem = EditableItem;
});
});
jsns.amd("hr.widgets.editableitemslist", function(define) {

define(["require", "exports", 'hr.controller', 'hr.toggles'], function (require, exports, controller, toggles) {
    "use strict";
    /**
     * This controller will bind data loaded to a model called 'listing'.
     * It also defines an add function that can be called as an hr event.
     */
    function EditableItemsListController(bindings, context) {
        var listing = bindings.getModel('listing');
        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var error = bindings.getToggle('error');
        var formToggles = new toggles.Group(load, main, error);
        formToggles.activate(main);
        function setData(data) {
            var creator = undefined;
            if (context.itemControllerConstructor !== undefined) {
                creator = controller.createOnCallback(context.itemControllerConstructor, context.itemControllerContext);
            }
            listing.setData(data, creator);
        }
        this.setData = setData;
        context.setData = setData;
        function add(evt) {
            evt.preventDefault();
            return context.add();
        }
        if (context.add !== undefined) {
            this.add = add;
        }
        context.showLoad = function () {
            formToggles.activate(load);
        };
        context.showMain = function () {
            formToggles.activate(main);
        };
        context.showError = function () {
            formToggles.activate(error);
        };
    }
    exports.EditableItemsListController = EditableItemsListController;
    ;
});
});
jsns.amd("hr.widgets.jdorn.json-editor", function(define) {

define(["require", "exports", 'jdorn.json-editor'], function (require, exports, jdorn_json_editor_1) {
    "use strict";
    jdorn_json_editor_1.JSONEditor.defaults.theme = 'bootstrap3custom';
    jdorn_json_editor_1.JSONEditor.defaults.iconlib = 'bootstrap3';
    jdorn_json_editor_1.JSONEditor.defaults.disable_collapse = true;
    jdorn_json_editor_1.JSONEditor.defaults.disable_edit_json = true;
    jdorn_json_editor_1.JSONEditor.defaults.disable_properties = true;
    //Override Boolean editors, we want checkboxes by default for booleans
    jdorn_json_editor_1.JSONEditor.defaults.resolvers.unshift(function (schema) {
        if (schema.type === 'boolean') {
            // If explicitly set to 'select', use that
            if (schema.format === "select" || (schema.options && schema.options.select)) {
                return "select";
            }
            // Otherwise, default to select menu
            return 'checkbox';
        }
    });
    /**
     * A model interface for the json editor.
     * @param {JSONEditor} editor - The editor to wrap.
     */
    function Model(editor) {
        this.setData = function (data) {
            editor.root.setValue(data, true);
        };
        this.appendData = this.setData;
        function clear() {
            editor.root.setValue(null, true);
        }
        this.clear = clear;
        this.getData = function () {
            return editor.getValue();
        };
        this.getSrc = function () {
            return null;
        };
        this.getEditor = function () {
            return editor;
        };
    }
    exports.Model = Model;
    function create(element, options) {
        return new Model(new jdorn_json_editor_1.JSONEditor(element, options));
    }
    exports.create = create;
});
});
jsns.amd("hr.widgets.jsonobjecteditor", function(define) {

define(["require", "exports", 'hr.toggles', 'hr.widgets.jdorn.json-editor', 'hr.promiseutils'], function (require, exports, toggles, jsonEditor, hr_promiseutils_1) {
    "use strict";
    var defaultError = { path: null };
    /**
     * This is a generic object editor that uses json-editor to edit objects.
     * The ui is determined by the html. This supports a load, main, error
     * lifecycle, but it is controlled externally. It can also be put on a
     * dialog named 'dialog', which it will activate when required. It also
     * consideres closing this dialog to be a cancellation and will send its
     * promise with an undefined result, which means cancel the operation.
     */
    function JsonObjectEditor(bindings, context) {
        var currentError = null;
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
        var fieldWatcher = new FieldWatcher(formEditor);
        var dialog = bindings.getToggle('dialog');
        dialog.offEvent.add(this, closed);
        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var error = bindings.getToggle('error');
        var formToggles = new toggles.Group(load, main, error);
        formToggles.activate(main);
        var currentPromise = null;
        function edit(data) {
            currentPromise = new hr_promiseutils_1.ExternalPromise();
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
        };
        context.showLoad = function () {
            formToggles.activate(load);
        };
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
        };
        context.clearError = function () {
            fieldWatcher.clear();
            currentError = null;
            formEditor.onChange();
            formToggles.activate(main);
            errorModel.clear();
        };
        context.show = function () {
            dialog.on();
        };
        context.close = function () {
            dialog.off();
        };
        function showCurrentErrorValidator(schema, value, path) {
            if (currentError !== null) {
                if (path === "root") {
                    return {
                        path: path,
                        message: currentError.message
                    };
                }
                if (currentError['errors'] !== undefined) {
                    //walk path to error
                    var shortPath = errorPath(path);
                    var errorObject = currentError.errors[shortPath];
                    if (errorObject !== undefined) {
                        //Listen for changes on field
                        fieldWatcher.watch(path, shortPath, currentError);
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
    exports.JsonObjectEditor = JsonObjectEditor;
    function FieldWatcher(formEditor) {
        var watchers = {};
        function watch(path, errorObjectPath, currentError) {
            if (watchers[path] !== undefined) {
                watchers[path].clear();
            }
            watchers[path] = new Watcher(formEditor, path, errorObjectPath, currentError);
        }
        this.watch = watch;
        function clear() {
            for (var key in watchers) {
                watchers[key].clear();
                delete watchers[key];
            }
        }
        this.clear = clear;
    }
    function Watcher(formEditor, path, errorObjectPath, currentError) {
        function handler() {
            if (currentError.errors.hasOwnProperty(errorObjectPath)) {
                delete currentError.errors[errorObjectPath];
            }
            //Not a huge fan of this, but needed to be able to unwatch during a watch callback
            window.setTimeout(clear, 1);
        }
        ;
        function clear() {
            formEditor.unwatch(path, handler);
        }
        this.clear = clear;
        formEditor.watch(path, handler);
    }
});
});
jsns.amd("hr.widgets.navmenu", function(define) {

define(["require", "exports", 'hr.controller', 'hr.eventhandler'], function (require, exports, controller, hr_eventhandler_1) {
    "use strict";
    var navMenus = {};
    function NavMenu() {
        var menuItems = [];
        var itemAdded = new hr_eventhandler_1.EventHandler();
        this.itemAdded = itemAdded.modifier;
        function add(name, controllerConstructor) {
            if (controllerConstructor !== undefined) {
                controllerConstructor = controller.createOnCallback(controllerConstructor);
            }
            var item = {
                name: name,
                created: controllerConstructor
            };
            menuItems.push(item);
            itemAdded.fire(item);
        }
        this.add = add;
        function getItems() {
            return menuItems;
        }
        this.getItems = getItems;
    }
    function getNavMenu(name) {
        var menu = navMenus[name];
        if (menu === undefined) {
            navMenus[name] = menu = new NavMenu();
        }
        return menu;
    }
    exports.getNavMenu = getNavMenu;
});
});
jsns.amd("hr.widgets.pageddata", function(define) {

define(["require", "exports", 'hr.http', 'hr.eventhandler'], function (require, exports, http, hr_eventhandler_1) {
    "use strict";
    function PagedData(src, resultsPerPage) {
        var updating = new hr_eventhandler_1.EventHandler();
        this.updating = updating.modifier;
        var updated = new hr_eventhandler_1.EventHandler();
        this.updated = updated.modifier;
        var error = new hr_eventhandler_1.EventHandler();
        this.error = error.modifier;
        this.resultsPerPage = resultsPerPage;
        this.currentPage = 0;
        function updateData() {
            updating.fire();
            var url = src + '?page=' + this.currentPage + '&count=' + this.resultsPerPage;
            http.get(url)
                .then(function (data) {
                updated.fire(data);
            })
                .catch(function (data) {
                error.fire(data);
            });
        }
        this.updateData = updateData;
    }
    exports.PagedData = PagedData;
});
});
jsns.amd("hr.widgets.pagenumbers", function(define) {

define(["require", "exports", 'hr.toggles', 'hr.eventhandler'], function (require, exports, toggles, hr_eventhandler_1) {
    "use strict";
    function PageNumbers(model, toggleProvider) {
        var pageToggles = [];
        var totalPages = 0;
        var buttonGroup = new toggles.Group();
        findToggles();
        var numButtons = pageToggles.length;
        var halfButton = Math.floor(numButtons / 2);
        var pageChangeRequested = new hr_eventhandler_1.EventHandler();
        this.pageChangeRequested = pageChangeRequested.modifier;
        var lowestDisplayedPage = 0;
        var self = this;
        this.currentPage = 0;
        this.totalResults = 0;
        this.resultsPerPage = 0;
        function moveToPage(newPageNum) {
            pageChangeRequested.fire(newPageNum);
        }
        function pageNumberLink(index) {
            return function () {
                moveToPage(lowestDisplayedPage + index);
            };
        }
        function next() {
            var page = self.currentPage + 1;
            if (page < totalPages) {
                moveToPage(page);
            }
        }
        function previous() {
            var page = self.currentPage - 1;
            if (page >= 0) {
                moveToPage(page);
            }
        }
        function findToggles() {
            var bindings = {
                previousPage: function (evt) {
                    evt.preventDefault();
                    previous();
                },
                nextPage: function (evt) {
                    evt.preventDefault();
                    next();
                }
            };
            var states = ["on", "off", "active"];
            var t = 0;
            var currentPage = 'page' + t;
            var toggle = toggleProvider.getToggle(currentPage, states);
            while (!toggles.isNullToggle(toggle)) {
                pageToggles.push(toggle);
                buttonGroup.add(toggle);
                bindings[currentPage] = pageNumberLink(t);
                currentPage = 'page' + ++t;
                toggle = toggleProvider.getToggle(currentPage, states);
            }
            toggleProvider.setListener(bindings);
        }
        function updatePages() {
            totalPages = Math.floor(this.totalResults / this.resultsPerPage);
            if (this.totalResults % this.resultsPerPage !== 0) {
                ++totalPages;
            }
            var j = 0;
            var i;
            if (this.currentPage + halfButton > totalPages) {
                i = totalPages - numButtons;
            }
            else {
                i = this.currentPage - halfButton;
            }
            if (i < 0) {
                i = 0;
            }
            lowestDisplayedPage = i;
            model.setData(function (page) {
                if (i === self.currentPage) {
                    buttonGroup.activate(pageToggles[j], 'active', 'on');
                }
                if (i >= totalPages) {
                    pageToggles[j].off();
                }
                ++j;
                return i++ + 1;
            });
        }
        this.updatePages = updatePages;
    }
    exports.PageNumbers = PageNumbers;
});
});
jsns.amd("hr.widgets.prompt", function(define) {

define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * A simple propmt that uses the browser confirm function, this wraps that function in a promise
     * so it matches the other prompt interfaces.
     */
    function BrowserPrompt() {
        function prompt(message) {
            return new Promise(function (resovle, reject) {
                if (confirm(message)) {
                    resovle(true);
                }
                else {
                    resovle(false);
                }
            });
        }
        this.prompt = prompt;
    }
    exports.BrowserPrompt = BrowserPrompt;
});
});
//# sourceMappingURL=HtmlRapierWidgets.js.map
