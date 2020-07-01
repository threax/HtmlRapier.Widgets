import * as events from 'hr.eventdispatcher';
import * as pageWidget from './PageNumberWidget';

export type ItemUpdatedCallback = (data: any) => Promise<any>;
export type ItemEditorClosedCallback = () => void;

export class ShowItemEditorEventArgs {
    /**
     * A promise to get the data.
     */
    dataPromise: Promise<any>;

    /**
     * The function to call to update the data. Can be null, which means update
     * cannot be performed.
     */
    update: ItemUpdatedCallback | null;

    /**
     * The function called when the item editor is closed. This might happen even if the data
     * is not updated. It also might never happen if "close" is not an appropriate action for
     * the editor. But if it appears in another window or location, this should fire.
     */
    closed: ItemEditorClosedCallback;

    /**
     * If the data came from another result this will have a value.
     * What value this is depends on the crud service that fired the event.
     */
    dataResult: any;

    constructor(dataPromise: Promise<any>, update: ItemUpdatedCallback | null, dataResult?: any, closed?: ItemEditorClosedCallback) {
        this.dataPromise = dataPromise;
        this.update = update;
        this.dataResult = dataResult;
        this.closed = closed;
    }
}

export class DataLoadingEventArgs {
    constructor(private _dataPromise: Promise<any>, private _query?: any) {
        if (this._query === undefined) {
            this._query = null;
        }
    }

    /**
     * Get the promise that will resolve when the data is loaded.
     */
    public get data(): Promise<any> {
        return this._dataPromise;
    }

    /**
     * Get the query used to load the data. This can be null if no 
     * query was provided when the loading event was triggered. Also
     * note that this query could have its properties in different formats
     * depending on how it was created. For example properties could be
     * in different cases or other mutations.
     */
    public get query(): any | null {
        return this._query;
    }
}

export class CrudDataModifiedEventArgs {

}

export class MainUiShownEventArgs {

}

export abstract class ICrudService {
    private showItemEditorDispatcher = new events.ActionEventDispatcher<ShowItemEditorEventArgs>();
    private showAddItemDispatcher = new events.ActionEventDispatcher<ShowItemEditorEventArgs>();
    private closeItemEditorDispatcher = new events.ActionEventDispatcher<void>();
    private dataLoadingDispatcher = new events.ActionEventDispatcher<DataLoadingEventArgs>();
    private crudDataModifiedDispatcher = new events.ActionEventDispatcher<CrudDataModifiedEventArgs>();
    private mainUiShownDispatcher = new events.ActionEventDispatcher<MainUiShownEventArgs>();

    /**
     * This function will return the schema for adding an item. The default implementation will just return
     * getItemSchema, but if you can return a unique schema for adding, overwrite this function.
     */
    public async getAddItemSchema(): Promise<any>{
        return this.getItemSchema();
    }

    /**
     * This function will return the schema for editing an item. This function should try to return update
     * schema first, and failing that return the add schema.
     */
    public abstract async getItemSchema(): Promise<any>;

    /**
     * Get the schema for listing objects in the table. This helps format items on the table according to how
     * the service dictates they should be formatted.
     */
    public abstract async getListingSchema(): Promise<any>;

    /**
     * Get the schema to use when searching for items in this service.
     */
    public abstract async getSearchSchema(): Promise<any>;

    /**
     * Start trying to add a new item to the service.
     * @param item The default settings for the item
     */
    public abstract async add(item?: any);

    /**
     * Determine if the crud service can add items.
     */
    public abstract async canAdd(): Promise<boolean>;

    /**
     * Start trying to edit an item in the service
     * @param item The item to edit
     */
    public abstract async edit(item: any);

    /**
     * Determine if an item can be edited.
     * @param item The item to check for editing capability
     */
    public abstract canEdit(item: any): boolean;

    /**
     * Get the prompt to show the user when trying to delete an item.
     * @param item The item to get the prompt for
     */
    public abstract getDeletePrompt(item: any): string;

    /**
     * Delete item
     * @param item The item to delete
     */
    public abstract async del(item: any): Promise<any>;

    /**
     * Determine if an item can be deleted.
     * @param item The item to check
     */
    public abstract canDel(item: any): boolean;

    /**
     * Get a particular page in the item collection based on the query.
     * @param query The query to use
     */
    public abstract getPage(query: any): Promise<any>;

    /**
     * Get the first page of the last query.
     */
    public abstract firstPage(): void;

    /**
     * Get the last page of the last query.
     */
    public abstract lastPage(): void;

    /**
     * Get the next page of the last query.
     */
    public abstract nextPage(): void;

    /**
     * Get the previous page of the last query.
     */
    public abstract previousPage(): void;

    /**
     * Refresh the page of the last query.
     */
    public abstract refreshPage(): void;

    /**
     * Get the items from a list result. This allows you to have the items be a separate object
     * from the result. This depends on your server implementation.
     * @param list The listing result.
     */
    public abstract getItems(list: any): any[];

    /**
     * Get the listing display object version of the given item.
     * @param item The item
     */
    public abstract getListingDisplayObject(item: any);

    /**
     * Get the object to pass to the page numbers to set their state.
     * @param list The listing result.
     */
    public abstract getPageNumberState(list: any): pageWidget.PageNumberState;

    /**
     * Get the view of item that is its search query.
     * @param item The item
     */
    public getSearchObject(item: any) {
        return item;
    }

    /**
     * This event is fired when the service is requesting to show the item editor.
     */
    public get showItemEditorEvent() {
        return this.showItemEditorDispatcher.modifier;
    }

    /**
     * Call this function to show the item editor. What editor is shown depends on how your crud page is setup.
     * @param args The args for showing the editor
     */
    protected fireShowItemEditorEvent(args: ShowItemEditorEventArgs) {
        this.showItemEditorDispatcher.fire(args);
    }

    /**
     * This event is fired when the service is requesting to show the add item editor.
     */
    public get showAddItemEvent() {
        return this.showAddItemDispatcher.modifier;
    }

    /**
     * Call this function to show the add item editor. What editor is really shown depends on how your crud page is setup.
     * @param args The args for showing the editor.
     */
    protected fireAddItemEvent(args: ShowItemEditorEventArgs) {
        this.showAddItemDispatcher.fire(args);
    }

    /**
     * This event is fired when item editors should close. Any open item editors should fire this event.
     */
    public get closeItemEditorEvent() {
        return this.closeItemEditorDispatcher.modifier;
    }

    /**
     * Fire this function to close any open item editors. This should apply to both add and update.
     */
    protected fireCloseItemEditorEvent() {
        this.closeItemEditorDispatcher.fire(undefined);
    }

    /**
     * This event is fired when the service is loading data for the main display.
     */
    public get dataLoadingEvent() {
        return this.dataLoadingDispatcher.modifier;
    }

    /**
     * Call this function to alert the crud page that main display data is loading.
     * @param args The args
     */
    protected fireDataLoadingEvent(args: DataLoadingEventArgs) {
        this.dataLoadingDispatcher.fire(args);
    }

    /**
     * This event is fired when the service has changed some of its data.
     */
    public get crudDataModifiedEvent() {
        return this.crudDataModifiedDispatcher.modifier;
    }

    /**
     * Call this function to alert the crud page that crud data has changed.
     * @param args The args
     */
    protected fireCrudDataModifiedEvent(args: CrudDataModifiedEventArgs) {
        this.crudDataModifiedDispatcher.fire(args);
    }

    /**
     * This event is fired when the service is loading data for the main display.
     */
    public get mainUiShownEvent() {
        return this.mainUiShownDispatcher.modifier;
    }

    /**
     * Call this function to alert the crud page that main display data is loading.
     * Since it is hard to know inside the service if the main ui is visible or not
     * this function is public so you can call it from the ui controller itself. Do
     * not call this unless you are the class responsible for showing/hiding the main ui.
     * @param args The args
     */
    public fireMainUiShownEvent(args: MainUiShownEventArgs) {
        this.mainUiShownDispatcher.fire(args);
    }
}