import * as controller from 'htmlrapier/src/controller';
export { DataLoadingEventArgs, ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs, CrudDataModifiedEventArgs } from './CrudService';
import * as crudRow from './CrudTableRow';
export { CrudTableRowController, CrudTableRowControllerExtensions } from './CrudTableRow';
import * as crudQuery from './CrudQuery';
export { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from './CrudQuery';
import * as crudSearch from './CrudSearch';
export { CrudSearch } from './CrudSearch';
import * as crudItemEditor from './CrudItemEditor';
export { CrudItemEditorController, CrudItemEditorControllerExtensions, CrudItemEditorControllerOptions, CrudItemEditorType } from './CrudItemEditor';
import * as crudPageNumbers from './CrudPageNumbers';
export { CrudPageNumbers } from './CrudPageNumbers';
import * as crudTable from './CrudTableController';
export { CrudTableController, CrudTableControllerExtensions, ListingDisplayOptions } from './CrudTableController';
import * as crudSort from './CrudSort';
export { CrudSort } from './CrudSort';
import * as crudPageView from './CrudPageView';
export { CrudPageView } from './CrudPageView';
import * as scrollback from './ScrollbackController';

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
    scrollback.addServices(services);
    crudTable.addServices(services);
    crudRow.addServices(services);
    crudItemEditor.addServices(services);
    crudPageNumbers.addServices(services);
    crudSearch.addServices(services);
    crudQuery.addServices(services);
    crudSort.addServices(services);
    crudPageView.addServices(services);
}