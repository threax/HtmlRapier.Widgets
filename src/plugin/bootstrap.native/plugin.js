"use strict";

//Include all dependencies to get them running
jsns.run([
    "hr.toggles",
    "hr.eventhandler",
    "thednp.bootstrap.native.affix",
    "thednp.bootstrap.native.button",
    "thednp.bootstrap.native.carousel",
    "thednp.bootstrap.native.collapse",
    "thednp.bootstrap.native.dropdown",
    "thednp.bootstrap.native.modal",
    "thednp.bootstrap.native.popover",
    "thednp.bootstrap.native.scrollspy",
    "thednp.bootstrap.native.tab",
    "thednp.bootstrap.native.tooltip",
],
function(exports, module, toggles, EventHandler, Affix, Button, Carousel, Collapse, DropDown, Modal, Popover, ScrollSpy, Tab, Tooltip){

    function ModalToggle(element, next) {
        var onEventHandler = new EventHandler();
        var offEventHandler = new EventHandler();

        this.onEvent = onEventHandler.modifier;
        this.offEvent = offEventHandler.modifier;

        var modal = new Modal(element);

        element.addEventListener("hidden.bs.modal", function (evt) {
            offEventHandler.fire();
        });

        element.addEventListener("shown.bs.modal", function (evt) {
            onEventHandler.fire();
        });

        function on() {
            modal.open();
            return next;
        }
        this.on = on;

        function off() {
            modal.close();
            return next;
        }
        this.off = off;

        function applyState(style) {
            return next;
        }
        this.applyState = applyState;
    }

    toggles.addTogglePlugin(function (element, states, toggle) {
        if (element.classList.contains('modal')) {
            toggle = new ModalToggle(element, toggle);
        }

        return toggle;
    });
});