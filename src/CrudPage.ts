import * as controller from 'hr.controller';
export { ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
export { DataLoadingEventArgs, ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs, CrudDataModifiedEventArgs } from 'hr.widgets.CrudService';
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
export { CrudTableController, CrudTableControllerExtensions } from 'hr.widgets.CrudTableController';
import * as crudSort from 'hr.widgets.CrudSort';
export { CrudSort } from 'hr.widgets.CrudSort';

/**
 * Setup the services to use a crud page in the given service collection. This will
 * try to add all services needed to make a crud page, but you will have to inject
 * your own ICrudService as the final piece to make everything work.
 * Since this uses try, you can override any services by injecting them before calling
 * this function. This will also inject the CrudPageNumbers and CrudSearch controllers,
 * so you can make instances of those without registering them.
 * @param {controller.ServiceCollection} services The service collection to add services to.
 */
export function addServices(services: controller.ServiceCollection) {
    crudTable.addServices(services);
    crudRow.addServices(services);
    crudItemEditor.addServices(services);
    crudPageNumbers.addServices(services);
    crudSearch.addServices(services);
    crudQuery.addServices(services);
    crudSort.addServices(services);
}