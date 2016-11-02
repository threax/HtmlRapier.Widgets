"use strict";

import * as controller from 'hr.controller';
import * as toggles from 'hr.toggles';

export class EditableItemsListControllerSettings{
    add?:any;

    itemControllerConstructor;

    itemControllerContext;

    pageActions:((evt:any)=>void)[];
}

/**
 * This controller will bind data loaded to a model called 'listing'.
 * It also defines an add function that can be called as an hr event.
 */
export class EditableItemsListController<T> {
    static GetCreator<T>(context: EditableItemsListControllerSettings){
        return new controller.ControllerBuilder<EditableItemsListController<T>, EditableItemsListControllerSettings, T>(EditableItemsListController, context);
    }

    private addFunc;
    private itemControllerConstructor;
    private itemControllerContext;
    private listing;
    private load: toggles.Toggle;
    private main: toggles.Toggle;
    private error: toggles.Toggle;
    private formToggles: toggles.Group;

    constructor(bindings, context: EditableItemsListControllerSettings){
        this.itemControllerConstructor = context.itemControllerConstructor;
        this.itemControllerContext = context.itemControllerContext;

        this.listing = bindings.getModel('listing');

        var load = bindings.getToggle('load');
        var main = bindings.getToggle('main');
        var error = bindings.getToggle('error');
        var formToggles = new toggles.Group(load, main, error);
        formToggles.activate(main);

        if (context.add !== undefined) {
            this.addFunc = context.add;
        }

        for (var key in context.pageActions) {
            this[key] = context.pageActions[key];
        }
    }

    add(evt) {
        if(this.addFunc !== undefined){
            evt.preventDefault();
            return this.addFunc();
        }
    }

    setData(data:T) {
        var creator = undefined;
        if (this.itemControllerConstructor !== undefined) {
            creator = controller.createOnCallback(this.itemControllerConstructor, this.itemControllerContext);
        }

        this.listing.setData(data, creator);
    }

    showLoad() {
        this.formToggles.activate(this.load);
    };

    showMain() {
        this.formToggles.activate(this.main);
    }

    showError() {
        this.formToggles.activate(this.error);
    }
};