"use strict";

import * as controller from 'hr.controller';
import * as toggles from 'hr.toggles';

/**
 * This controller will bind data loaded to a model called 'listing'.
 * It also defines an add function that can be called as an hr event.
 */
export function EditableItemsListController(bindings, context) {
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

    for (var key in context.pageActions) {
        this[key] = context.pageActions[key];
    }

    context.showLoad = function () {
        formToggles.activate(load);
    };

    context.showMain = function () {
        formToggles.activate(main);
    }

    context.showError = function () {
        formToggles.activate(error);
    }
};