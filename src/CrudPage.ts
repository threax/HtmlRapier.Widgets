import * as controller from 'hr.controller';
import { ListingDisplayController, ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import { IConfirm, BrowserConfirm } from 'hr.widgets.confirm';
import { IAlert, BrowserAlert } from 'hr.widgets.alert';
import * as pageWidget from 'hr.widgets.PageNumberWidget';
export { ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import * as events from 'hr.eventdispatcher';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as form from 'hr.form';
import * as error from 'hr.error';
import * as schema from 'hr.schema';
import * as view from 'hr.view';
import { DataLoadingEventArgs, ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs } from 'hr.widgets.CrudService';
export { DataLoadingEventArgs, ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs } from 'hr.widgets.CrudService';
import { CrudTableRowController, CrudTableRowControllerExtensions, addServices as addRowServices } from 'hr.widgets.CrudTableRow';
export { CrudTableRowController, CrudTableRowControllerExtensions } from 'hr.widgets.CrudTableRow';
import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
export { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import { CrudSearch } from 'hr.widgets.CrudSearch';
export { CrudSearch } from 'hr.widgets.CrudSearch';
import { CrudItemEditorController, CrudItemEditorControllerExtensions, CrudItemEditorControllerOptions, CrudItemEditorType } from 'hr.widgets.CrudItemEditor';
export { CrudItemEditorController, CrudItemEditorControllerExtensions, CrudItemEditorControllerOptions, CrudItemEditorType } from 'hr.widgets.CrudItemEditor';
import { CrudPageNumbers } from 'hr.widgets.CrudPageNumbers';
export { CrudPageNumbers } from 'hr.widgets.CrudPageNumbers';
import { CrudTableController } from 'hr.widgets.CrudTableController';
export { CrudTableController } from 'hr.widgets.CrudTableController';

/**
 * Setup the services to use a crud page in the given service collection. This will
 * try to add all services needed to make a crud page, but you will have to inject
 * your own ICrudService as the final piece to make everything work.
 * Since this uses try, you can override any services by injecting them before calling
 * this function. This will also inject the CrudPageNumbers and CrudSearch controllers,
 * so you can make instances of those without registering them.
 * @param {controller.ServiceCollection} services The service collection to add services to.
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudTableController, CrudTableController);
    services.tryAddSharedInstance(ListingDisplayOptions, new ListingDisplayOptions());
    addRowServices(services);

    //Register all types of crud item editor, the user can ask for what they need when they build their page
    //Undefined id acts as both add and update, by default the options and extensions are shared with all editors, unless otherwise specified
    services.tryAddSharedInstance(CrudItemEditorControllerOptions, new CrudItemEditorControllerOptions());
    services.tryAddSharedInstance(CrudItemEditorControllerExtensions, new CrudItemEditorControllerExtensions());
    services.tryAddShared(CrudItemEditorController,
    s => {
        return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredService(CrudItemEditorControllerExtensions), s.getRequiredService(ICrudService), s.getRequiredService(CrudItemEditorControllerOptions))
    });

    //Add Item Editor
    services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorControllerExtensions, s => s.getRequiredService(CrudItemEditorControllerExtensions));
    services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorControllerOptions, s => s.getRequiredService(CrudItemEditorControllerOptions));
    services.tryAddSharedId(CrudItemEditorType.Add, CrudItemEditorController,
        s => {
            var options = s.getRequiredServiceId(CrudItemEditorType.Add, CrudItemEditorControllerOptions);
            var customOptions = Object.create(options);
            customOptions.type = CrudItemEditorType.Add;
            return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredServiceId(CrudItemEditorType.Add, CrudItemEditorControllerExtensions), s.getRequiredService(ICrudService), customOptions)
        });

    //Update item editor
    services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorControllerExtensions, s => s.getRequiredService(CrudItemEditorControllerExtensions));
    services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorControllerOptions, s => s.getRequiredService(CrudItemEditorControllerOptions));
    services.tryAddSharedId(CrudItemEditorType.Update, CrudItemEditorController, s => { 
            var options = s.getRequiredServiceId(CrudItemEditorType.Update, CrudItemEditorControllerOptions);
            var customOptions = Object.create(options);
            customOptions.type = CrudItemEditorType.Update;
            return new CrudItemEditorController(s.getRequiredService(controller.BindingCollection), s.getRequiredServiceId(CrudItemEditorType.Update, CrudItemEditorControllerExtensions), s.getRequiredService(ICrudService), customOptions)
        });
    
    //Additional page services like search and page numbers
    services.tryAddTransient(CrudPageNumbers, CrudPageNumbers);
    services.tryAddTransient(CrudSearch, CrudSearch);
    services.tryAddShared(CrudQueryManager, s => {
        return new CrudQueryManager();
    });
}