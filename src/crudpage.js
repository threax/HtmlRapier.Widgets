jsns.define("hr.widgets.crudpage", [
    "hr.controller",
    "hr.widgets.jsonobjecteditor",
    "hr.widgets.editableitemslist",
    "hr.widgets.editdeleteitem"
],
function (exports, module, controller, JsonObjectEditor, EditableItemsList, EditDeleteItem) {
    "use strict"

    /**
     * This is a shortcut to create a page to create, read, update and delete a type of
     * data provided by a service. A model of the data is used to construct an editor
     * automatically from elements on the page.
     * @param {type} settings
     */
    function CrudPage(settings) {
        var listingContext = {
            itemControllerConstructor: EditDeleteItem,
            itemControllerContext: {
                edit: function (item) {
                    return edit(item, settings.update);
                },
                del: deleteItem
            },
            getData: settings.list,
            add: function () {
                return edit(null, settings.create);
            }
        };
        controller.create(settings.listController, EditableItemsList, listingContext);

        var editorContext = {
            schema: settings.schema,
        };
        controller.create(settings.itemEditorController, JsonObjectEditor, editorContext);

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
            listingContext.showLoad();
            return settings.del(item)
            .then(function (data) {
                return refreshData();
            });
        }

        function edit(data, persistFunc) {
            editorContext.showLoad();
            editorContext.show();
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
    };

    module.exports = CrudPage;
});