jsns.define("hr.widgets.editableitem", [
    "hr.controller",
    "hr.typeidentifiers",
],
function (exports, module, controller, typeId) {
    "use strict"

    function EditDeleteItemController(bindings, context, data) {
        var self = this;

        for (var key in context) {
            if (typeId.isFunction(context[key])) {
                self[key] = (function (evtName) {
                    return function (evt) {
                        evt.preventDefault();
                        context[evtName](data);
                    }
                })(key);
            }
        }
    }

    module.exports = EditDeleteItemController;
});