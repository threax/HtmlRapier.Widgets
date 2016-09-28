jsns.define("hr.widgets.editableitemslist", [
    "hr.controller",
    "hr.toggles"
],
function (exports, module, controller, toggles) {
    "use strict"

    /**
     * This controller will bind data loaded to a model called 'listing'.
     * It also defines an add function that can be called as an hr event.
     */
    function EditableItemsListController(bindings, context) {
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

        if (context.add !== undefined) {
            function add(evt) {
                evt.preventDefault();
                return context.add();
            }
            this.add = add;
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

    module.exports = EditableItemsListController;
});