"use strict";

import * as controller from 'hr.controller';
import * as JsonObjectEditor from 'hr.jsonobjecteditor';
import * as EditableItemsList from 'hr.editableitemslist';
import * as EditableItem from 'hr.editableitem';
import * as prompt from 'hr.prompt';

/**
 * This is a shortcut to create a page to create, read, update and delete a type of
 * data provided by a service. A model of the data is used to construct an editor
 * automatically from elements on the page.
 * @param {type} settings
 */
export function CrudPage(settings) {
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
        itemControllerConstructor: EditableItem,
        itemControllerContext: listingActions,
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
};