"use strict";

import * as controller from 'hr.controller';
import { JsonObjectEditor, JsonObjectEditorOptions } from 'hr.widgets.jsonobjecteditor';
import { EditableItemsListController } from 'hr.widgets.editableitemslist';
import { EditableItem } from 'hr.widgets.editableitem';
import * as confirm from 'hr.widgets.confirm';
import {StrongTypeConstructor} from 'hr.models';

export class CrudPageSettings<T>{
    /**
     * The name of the property in the data that represents 
     * a pretty name for the item we can display to the user.
     * Defaults to name.
     */
    itemNameProperty?:string;

    /**
     * An optional delete prompt to use to confirm deletion of an item, otherwise
     * uses the browser confirm dialog.
     */
    deletePrompt?:confirm.Confirm;

    /**
     * Additional actions to listen to for individual items.
     */
    listingActions?;

    /**
     * Additional actions to listen to for the list of items.
     */
    pageActions?;

    /**
     * A json schema to describe the object that this crud page will edit.
     */
    schema:any;

    /**
     * The name of the html rapier controller to build the listing controller instance with.
     */
    listController:string;

    /**
     * The name of the html rapier controller to build the item editor with.
     */
    itemEditorController:string;

    /**
     * This function will create a new item in its repository.
     */
    create:(data:T) => Promise<void>;

    /**
     * This function will list all the items in the repository.
     */
    list:() => Promise<T[]>;

    /**
     * This function will update the data the page is editing in its repository.
     */
    update:(data:T) => Promise<void>;

    /**
     * This function will delete an item from its repository.
     */
    del:(data:T) => Promise<void>;

    /**
     * A constructor to create a strongly typed version of the object
     * edited by this editor. If the editor is for an any type you
     * won't need this, otherwise provide it so the objects coming out
     * of the editor always have the expected type.
     */
    strongConstructor?:StrongTypeConstructor<T>;
}

/**
 * This is a shortcut to create a page to create, read, update and delete a type of
 * data provided by a service. A model of the data is used to construct an editor
 * automatically from elements on the page.
 * @param {type} settings
 */
export class CrudPage<T> {
    private listingActions;
    private pageActions;
    private deleteConfirm: confirm.Confirm;
    private settings: CrudPageSettings<T>;
    private listingController: EditableItemsListController<T>;
    private itemEditorController: JsonObjectEditor<T>;

    constructor(settings: CrudPageSettings<T>){
        this.settings = settings;
        this.listingActions = settings['listingActions'];
        if (this.listingActions === undefined) {
            this.listingActions = {};
        }

        if (settings['itemNameProperty'] === undefined) {
            settings.itemNameProperty = "name";
        }

        this.pageActions = settings['pageActions'];
        if (this.pageActions === undefined) {
            this.pageActions = {};
        }

        this.listingActions.edit = (item) => this.edit(item, settings.update);

        this.listingActions.del = (item) => this.deleteItem(item);

        this.deleteConfirm = settings['deletePrompt'];
        if (this.deleteConfirm === undefined) {
            this.deleteConfirm = new confirm.BrowserConfirm();
        }

        var listingContext: any = {
            itemControllerConstructor: EditableItem,
            itemControllerContext: this.listingActions,
            getData: settings.list,
            add: () => this.edit(null, settings.create),
            pageActions: this.pageActions
        };

        this.listingController = EditableItemsListController.GetCreator<T>(listingContext).create(settings.listController)[0];

        var editorContext: JsonObjectEditorOptions<T> = {
            schema: settings.schema,
            strongConstructor: settings.strongConstructor
        };
        this.itemEditorController = JsonObjectEditor.GetCreator<T>(editorContext).create(settings.itemEditorController)[0];
    }

    refreshData() {
        this.listingController.showLoad();
        return Promise.resolve(this.settings.list())
            .then((data) => {
                this.listingController.setData(data);
                this.listingController.showMain();
            })
            .catch((err) => {
                this.listingController.showError();
                throw err;
            });
    }

    deleteItem(item) {
        return this.deleteConfirm.confirm("Delete " + item[this.settings.itemNameProperty] + " ?")
            .then((result) => {
                if (result) {
                    this.listingController.showLoad();
                    return this.settings.del(item)
                        .then((data) => {
                            return this.refreshData();
                        });
                }
            });
    }

    edit(data, persistFunc) {
        this.itemEditorController.showLoad();
        this.itemEditorController.show();
        this.itemEditorController.clearError();
        return Promise.resolve(data)
            .then((data) => {
                this.itemEditorController.showMain();
                return this.goEdit(data, persistFunc);
            });
    }

    private goEdit(data, persistFunc) {
        return this.itemEditorController.edit(data)
            .then((data) => {
                if (data !== undefined) {
                    this.itemEditorController.showLoad();
                    if (persistFunc === undefined) {
                        throw new Error("Cannot save updates to item, no persistFunc given.");
                    }
                    return Promise.resolve(persistFunc(data))
                        .then((data) => {
                            this.itemEditorController.close();
                            this.refreshData();
                        })
                        .catch((err) => {
                            this.itemEditorController.showError(err);
                            var modifiedData = this.itemEditorController.getData();
                            this.goEdit(modifiedData, persistFunc);
                            throw err;
                        });
                }
            });
    }
};