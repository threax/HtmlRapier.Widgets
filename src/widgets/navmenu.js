"use strict";

jsns.define("hr.widgets.navmenu", [
    "hr.eventhandler",
    "hr.controller"
],
function (exports, module, EventHandler, controller) {
    var navMenus = {};

    function NavMenu() {
        var menuItems = [];

        var itemAdded = new EventHandler();
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