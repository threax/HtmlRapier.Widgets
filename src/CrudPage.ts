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
import * as crudRow from 'hr.widgets.CrudTableRow';
export { CrudTableRowController, CrudTableRowControllerExtensions } from 'hr.widgets.CrudTableRow';
import * as crudQuery from 'hr.widgets.CrudQuery';
export { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as crudSearch from 'hr.widgets.CrudSearch';
export { CrudSearch } from 'hr.widgets.CrudSearch';
import * as crudItemEditor from 'hr.widgets.CrudItemEditor';
export { CrudItemEditorController, CrudItemEditorControllerExtensions, CrudItemEditorControllerOptions, CrudItemEditorType } from 'hr.widgets.CrudItemEditor';
import * as crudPageNumbers from 'hr.widgets.CrudPageNumbers';
export { CrudPageNumbers } from 'hr.widgets.CrudPageNumbers';
import * as crudTable from 'hr.widgets.CrudTableController';
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
    crudTable.addServices(services);
    crudRow.addServices(services);
    crudItemEditor.AddServices(services);
    crudPageNumbers.addServices(services);
    crudSearch.addServices(services);
    crudQuery.addServices(services);
}