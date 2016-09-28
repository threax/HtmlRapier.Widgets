jsns.define("hr.widgets.editdeleteitem", [
    "hr.controller",
    "hr.typeidentifiers",
],
function (exports, module, controller, typeId) {
    "use strict"

    function EditDeleteItemController(bindings, context, data) {

        if (typeId.isFunction(context.edit)) {
            function edit(evt) {
                evt.preventDefault();
                context.edit(data);
            }
            this.edit = edit;
        }

        if (typeId.isFunction(context.del)) {
            function del(evt) {
                evt.preventDefault();
                context.del(data);
            }
            this.del = del;
        }
    }

    module.exports = EditDeleteItemController;
});