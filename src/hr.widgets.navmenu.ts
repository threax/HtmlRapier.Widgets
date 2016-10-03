"use strict";

import * as controller from 'hr.controller';
import { EventHandler } from 'hr.eventhandler';

var navMenus = {};

function NavMenu() {
    var menuItems = [];

    var itemAdded = new EventHandler();
    this.itemAdded = itemAdded.modifier;

    function add(name, controllerConstructor: any) {
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

export function getNavMenu(name) {
    var menu = navMenus[name];
    if (menu === undefined) {
        navMenus[name] = menu = new NavMenu();
    }
    return menu;
}