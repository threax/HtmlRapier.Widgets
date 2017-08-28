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

export class ShowItemEditorEventArgs {
    /**
     * A promise to get the data.
     */
    dataPromise: Promise<any>;

    /**
     * The function to call to update the data.
     */
    update: ItemUpdatedCallback;

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

    constructor(dataPromise: Promise<any>, update: ItemUpdatedCallback, dataResult?: any, closed?: ItemEditorClosedCallback) {
        this.dataPromise = dataPromise;
        this.update = update;
        this.dataResult = dataResult;
        this.closed = closed;
    }
}

export class DataLoadingEventArgs {
    private _dataPromise: Promise<any>;

    constructor(dataPromise: Promise<any>) {
        this._dataPromise = dataPromise;
    }

    public get data(): Promise<any> {
        return this._dataPromise;
    }
}

export abstract class ICrudService {
    private showItemEditorDispatcher = new events.ActionEventDispatcher<ShowItemEditorEventArgs>();
    private showAddItemDispatcher = new events.ActionEventDispatcher<ShowItemEditorEventArgs>();
    private closeItemEditorDispatcher = new events.ActionEventDispatcher<void>();
    private dataLoadingDispatcher = new events.ActionEventDispatcher<DataLoadingEventArgs>();

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
}

export type ItemUpdatedCallback = (data: any) => Promise<any>;
export type ItemEditorClosedCallback = () => void;

export enum CrudItemEditorType{
    Add = 1,
    Update = 1 << 1
}

export class CrudItemEditorControllerOptions {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [];
    }

    public formName = "input";
    public dialogName = "dialog";
    public mainErrorToggleName = "mainError";
    public mainErrorViewName = "mainError";
    public mainToggleName = "main";
    public loadToggleName = "load";
    public errorToggleName = "error";
    public activateLoadingOnStart = true;
    public type = CrudItemEditorType.Add | CrudItemEditorType.Update;
}

export class CrudItemEditorControllerExtensions {
    constructed(editor: CrudItemEditorController, bindings: controller.BindingCollection): void {

    }

    setup(editor: CrudItemEditorController): Promise<void> {
        return Promise.resolve(undefined);
    }
}

export class CrudItemEditorController{
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection,
            CrudItemEditorControllerExtensions,
            ICrudService,
            /*Options here, must call constructor manually unless defaults are ok. Leave options last.*/];
    }

    private _form: controller.IForm<any>;
    private dialog: controller.OnOffToggle;
    private lifecycle: MainLoadErrorLifecycle;
    private updated: ItemUpdatedCallback;
    private closed: ItemEditorClosedCallback;
    private _autoClose: boolean = true;
    private mainErrorToggle: controller.OnOffToggle;
    private mainErrorView: controller.IView<Error>;

    constructor(bindings: controller.BindingCollection,
        private extensions: CrudItemEditorControllerExtensions,
        crudService: ICrudService,
        options: CrudItemEditorControllerOptions)
    {
        if(options === undefined){
            options = new CrudItemEditorControllerOptions();
        }

        this._form = new form.NeedsSchemaForm<any>(bindings.getForm<any>(options.formName));
        this.dialog = bindings.getToggle(options.dialogName);
        this.dialog.offEvent.add(i => !this.closed || this.closed());
        this.mainErrorToggle = bindings.getToggle(options.mainErrorToggleName);
        this.mainErrorView = bindings.getView<Error>(options.mainErrorViewName);
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(options.mainToggleName),
            bindings.getToggle(options.loadToggleName),
            bindings.getToggle(options.errorToggleName),
            options.activateLoadingOnStart);

        if((options.type & CrudItemEditorType.Add) === CrudItemEditorType.Add){
            crudService.showAddItemEvent.add(arg => {
                this.showItemEditorHandler(arg);
            });
        }
        if((options.type & CrudItemEditorType.Update) === CrudItemEditorType.Update){
            crudService.showItemEditorEvent.add(arg => {
                this.showItemEditorHandler(arg);
            });
        }
        crudService.closeItemEditorEvent.add(() => {
            this.dialog.off();
        });
        this.extensions.constructed(this, bindings);
        this.setup(crudService, options);
    }

    public async submit(evt: Event): Promise<void> {
        evt.preventDefault();
        try {
            this.mainErrorToggle.off();
            this.lifecycle.showLoad();
            var data = this._form.getData() || {}; //Form returns null, but to get errors from the server, need to at least send an empty object
            await this.updated(data);
            this.lifecycle.showMain();
            if(this._autoClose){
                this.dialog.off();
            }
        }
        catch (err) {
            if (error.isFormErrors(err)) {
                this._form.setError(err);
                this.lifecycle.showMain();
                this.mainErrorView.setData(err);
                this.mainErrorToggle.on();
            }
            else {
                this.lifecycle.showError(err);
            }
        }
    }

    public get autoClose(): boolean{
        return this._autoClose;
    }

    public set autoClose(value: boolean){
        this._autoClose = value;
    }

    public get form(): controller.IForm<any> {
        return this._form;
    }

    private async showItemEditorHandler(arg: ShowItemEditorEventArgs) {
        this.mainErrorToggle.off();
        try {
            this.dialog.on();
            this.lifecycle.showLoad();
            var data = await arg.dataPromise;
            this.updated = arg.update;
            this.closed = arg.closed;
            this._form.setData(data);
            this.lifecycle.showMain();
        }
        catch (err) {
            this.lifecycle.showError(err);
        }
    }

    private async setup(crudService: ICrudService, options: CrudItemEditorControllerOptions) {
        try {
            await this.extensions.setup(this);
            var schema;
            if((options.type & CrudItemEditorType.Update) === CrudItemEditorType.Update) {
                //This covers the case where the editor is an update only or update and add
                schema = await crudService.getItemSchema();
            }
            else if((options.type & CrudItemEditorType.Add) === CrudItemEditorType.Add) {
                //This convers when the editor is for adding items
                schema = await crudService.getAddItemSchema();
            }
            this._form.setSchema(schema);
        }
        catch (err) {
            console.log("An error occured loading the schema for the CrudItemEditor. Message: " + err.message);
        }
    }
}

export class CrudTableRowController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, IConfirm, ICrudService, IAlert, controller.InjectControllerData];
    }

    protected data: any;
    protected crudService: ICrudService;
    protected confirm: IConfirm;
    protected alert: IAlert;

    constructor(bindings: controller.BindingCollection, confirm: IConfirm, crudService: ICrudService, alert: IAlert, data: any) {
        this.data = data;
        this.crudService = crudService;
        this.confirm = confirm;
        this.alert = alert;

        if (!this.crudService.canEdit(data)) {
            var editToggle = bindings.getToggle("edit");
            editToggle.off();
        }

        if (!this.crudService.canDel(data)) {
            var deleteToggle = bindings.getToggle("del");
            deleteToggle.off();
        }
    }

    public edit(evt: Event) {
        evt.preventDefault();
        this.crudService.edit(this.data);
    }

    public async del(evt: Event) {
        evt.preventDefault();
        if (await this.confirm.confirm(this.crudService.getDeletePrompt(this.data))) {
            try {
                await this.crudService.del(this.data);
            }
            catch (err) {
                var message = "An error occured deleting data.";
                if (err.message) {
                    message += " Message: " + err.message;
                }
                console.log(message);
                this.alert.alert(message);
            }
        }
    }
}

export class QueryEventArgs {
    private _query: any;

    constructor(query: any) {
        this._query = query;
    }

    public get query() {
        return this._query;
    }
}

export class CrudQueryManager {
    private loadPageDispatcher = new events.ActionEventDispatcher<QueryEventArgs>();
    private components: ICrudQueryComponent[] = [];

    public get loadPageEvent() {
        return this.loadPageDispatcher.modifier;
    }

    public addComponent(component: ICrudQueryComponent) {
        this.components.push(component);
        component.loadPageEvent.add(a => this.fireLoadPageEvent());
    }

    private fireLoadPageEvent() {
        var query = {};
        for (var i = 0; i < this.components.length; ++i) {
            this.components[i].setupQuery(query);
        }
        this.loadPageDispatcher.fire(new QueryEventArgs(query));
    }

    public setupQuery(): any {
        var query = {};
        for (var i = 0; i < this.components.length; ++i) {
            this.components[i].setupQuery(query);
        }
        return query;
    }
}

export abstract class ICrudQueryComponent {
    private loadPageDispatcher = new events.ActionEventDispatcher<void>();

    public get loadPageEvent() {
        return this.loadPageDispatcher.modifier;
    }

    protected fireLoadPage() {
        this.loadPageDispatcher.fire(undefined);
    }

    public abstract setupQuery(query: any): void;
}

interface PageNumberQuery {
    offset: number;
    limit: number;
}

interface PageNumberItemCount {
    itemStart: number;
    itemEnd: number;
    total: number;
}

interface ItemsPerPage {
    itemsPerPage: number;
}

export class CrudPageNumbers extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private queryManager: CrudQueryManager;
    private pageNumbers: pageWidget.PageNumberWidget;
    private crudService: ICrudService;
    private currentPage: number = 0;
    private itemCountsModel: controller.Model<PageNumberItemCount>;
    private totalPerPageModel: controller.Model<ItemsPerPage>;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager) {
        super();
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.pageNumbers = new pageWidget.PageNumberWidget(bindings, new pageWidget.PageNumberWidgetOptions(this));
        this.pageNumbers.loadPageEvent.add(arg => this.loadPage(arg.page));
        this.pageNumbers.loadFirstEvent.add(arg => this.crudService.firstPage());
        this.pageNumbers.loadPreviousEvent.add(arg => this.crudService.previousPage());
        this.pageNumbers.loadNextEvent.add(arg => this.crudService.nextPage());
        this.pageNumbers.loadLastEvent.add(arg => this.crudService.lastPage());

        this.itemCountsModel = bindings.getModel<PageNumberItemCount>("totals");
        this.totalPerPageModel = bindings.getModel<ItemsPerPage>("itemsPerPage");
        this.totalPerPageModel.setData({
            itemsPerPage: 10
        });
    }

    private loadPage(page: number) {
        this.currentPage = page;
        this.crudService.getPage(this.queryManager.setupQuery());
    }

    public setupQuery(query: PageNumberQuery): void {
        query.offset = this.currentPage;
        var perPage = this.totalPerPageModel.getData();
        if (perPage.itemsPerPage === undefined) {
            perPage.itemsPerPage = 10;
        }
        query.limit = perPage.itemsPerPage;
    }

    public itemsPerPageChanged(evt: Event) {
        evt.preventDefault();
        this.crudService.getPage(this.queryManager.setupQuery());
    }

    public setData(pageData: any): void {
        var pageState = this.crudService.getPageNumberState(pageData);
        this.pageNumbers.setState(pageState);
        this.itemCountsModel.setData(pageState);
        this.totalPerPageModel.setData({
            itemsPerPage: pageState.limit
        });
        this.currentPage = pageState.offset;
    }

    private async handlePageLoad(promise: Promise<any>) {
        try {
            this.setData(await promise);
        }
        catch (err) {
            console.log("Error loading crud table data for pages. Message: " + err.message);
        }
    }
}

export class CrudSearch extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private queryManager: CrudQueryManager;
    private crudService: ICrudService;
    private form: controller.IForm<any>;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager) {
        super();
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.form = new form.NeedsSchemaForm(bindings.getForm<any>("input"));
        this.setup(bindings, crudService);
    }

    private async setup(bindings: controller.BindingCollection, crudService: ICrudService) {
        var schema: any = await crudService.getSearchSchema();
        //Look for x-ui-search properties that are true
        var properties = schema.properties;
        if (properties) {
            for (var key in properties) {
                var prop = properties[key];
                if (prop["x-ui-search"] !== true) {
                    delete properties[key]; //Delete all properties that do not have x-ui-search set.
                }
            }
        }

        this.form.setSchema(schema);
    }

    public setupQuery(query: any): void {
        var searchQuery = this.form.getData();
        if (searchQuery !== null) {
            for (var key in searchQuery) {
                if (query[key] === undefined) {
                    query[key] = searchQuery[key];
                }
            }
        }
    }

    public submit(evt: Event) {
        evt.preventDefault();
        this.crudService.getPage(this.queryManager.setupQuery());
    }

    public setData(pageData: any): void {
        this.form.setData(this.crudService.getSearchObject(pageData));
    }

    private async handlePageLoad(promise: Promise<any>) {
        try {
            this.setData(await promise);
        }
        catch (err) {
            console.log("Error loading crud table data for search. Message: " + err.message);
        }
    }
}

export class CrudTableController extends ListingDisplayController<any> {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ListingDisplayOptions, ICrudService, CrudQueryManager, controller.InjectedControllerBuilder];
    }

    private crudService: ICrudService;
    private queryManager: CrudQueryManager;
    private addToggle: controller.OnOffToggle;
    private lookupDisplaySchema = true;

    constructor(bindings: controller.BindingCollection, options: ListingDisplayOptions, crudService: ICrudService, queryManager: CrudQueryManager, private builder: controller.InjectedControllerBuilder) {
        super(bindings, options);

        this.queryManager = queryManager;
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.addToggle = bindings.getToggle("add");
        if (options.setLoadingOnStart) {
            this.crudService.getPage(queryManager.setupQuery()); //Fires async
        }
    }

    public add(evt: Event) {
        evt.preventDefault();
        this.crudService.add();
    }

    public setData(pageData: any) {
        var items = this.crudService.getItems(pageData);
        this.clearData();
        var listingCreator = this.builder.createOnCallback(CrudTableRowController);
        for (var i = 0; i < items.length; ++i) {
            var itemData = this.crudService.getListingDisplayObject(items[i]);
            this.appendData(itemData, (b, d) => {                
                listingCreator(b, items[i]);
            });
        }
        this.showMain();
    }

    private async handlePageLoad(promise: Promise<any>) {
        this.showLoad();

        try {
            var data = await promise; //Important to await this first

            if (this.lookupDisplaySchema) {
                this.lookupDisplaySchema = false;
                var schema = await this.crudService.getListingSchema();
                if (schema) {
                    this.setFormatter(new view.SchemaViewDataFormatter(schema));
                }
            }

            this.setData(data);

            if (this.addToggle && ! await this.crudService.canAdd()) {
                this.addToggle.off();
            }
            this.addToggle = undefined; //Saw this once, thats all we care about
        }
        catch (err) {
            console.log("Error loading crud table data. Message: " + err.message);
            this.showError(err);
        }
    }
}

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
    services.tryAddTransient(CrudTableRowController, CrudTableRowController);
    services.tryAddShared(IConfirm, s => new BrowserConfirm());
    services.tryAddShared(IAlert, s => new BrowserAlert());
    
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