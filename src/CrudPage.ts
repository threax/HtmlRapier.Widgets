import * as controller from 'hr.controller';
import { ListingDisplayController, ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import { IConfirm, BrowserConfirm } from 'hr.widgets.confirm';
import { IAlert, BrowserAlert } from 'hr.widgets.alert';
import * as pageWidget from 'hr.widgets.PageNumberWidget';
export { ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import * as events from 'hr.eventdispatcher';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as form from 'hr.form';

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
     * If the data came from another result this will have a value.
     * What value this is depends on the crud service that fired the event.
     */
    dataResult: any;

    constructor(dataPromise: Promise<any>, update: ItemUpdatedCallback, dataResult?: any) {
        this.dataPromise = dataPromise;
        this.update = update;
        this.dataResult = dataResult;
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
    private dataLoadingDispatcher = new events.ActionEventDispatcher<DataLoadingEventArgs>();

    public abstract async getItemSchema(): Promise<any>;

    public abstract async getSearchSchema(): Promise<any>;

    public abstract async add(item?: any);

    public abstract async canAdd(): Promise<boolean>;

    public abstract async edit(item: any);

    public abstract canEdit(item: any): boolean;

    public abstract getDeletePrompt(item: any): string;

    public abstract async del(item: any): Promise<any>;

    public abstract canDel(item: any): boolean;

    public abstract getPage(query: any): Promise<any>;

    public abstract firstPage(): void;

    public abstract lastPage(): void;

    public abstract nextPage(): void;

    public abstract previousPage(): void;

    public abstract refreshPage(): void;

    public abstract getItems(list: any): any[];

    public abstract getListingDisplayObject(item: any);

    public abstract getPageNumberState(list: any): pageWidget.PageNumberState;

    public get showItemEditorEvent() {
        return this.showItemEditorDispatcher.modifier;
    }

    protected fireShowItemEditorEvent(args: ShowItemEditorEventArgs) {
        this.showItemEditorDispatcher.fire(args);
    }

    public get dataLoadingEvent() {
        return this.dataLoadingDispatcher.modifier;
    }

    protected fireDataLoadingEvent(args: DataLoadingEventArgs) {
        this.dataLoadingDispatcher.fire(args);
    }
}

export type ItemUpdatedCallback = (data: any) => Promise<any>;

export class CrudItemEditorController{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ICrudService];
    }

    private form: controller.IForm<any>;
    private dialog: controller.OnOffToggle;
    private lifecycle: MainLoadErrorLifecycle;
    private updated: ItemUpdatedCallback;
    private _autoClose: boolean = true;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService) {
        this.form = new form.NeedsSchemaForm<any>(bindings.getForm<any>("input"));
        this.dialog = bindings.getToggle("dialog");
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle("main"),
            bindings.getToggle("load"),
            bindings.getToggle("error"),
            true);
        crudService.showItemEditorEvent.add(arg => {
            this.showItemEditorHandler(arg);
        });
        this.setup(crudService);
    }

    public async submit(evt: Event): Promise<void> {
        evt.preventDefault();
        try{
            this.lifecycle.showLoad();
            var data = this.form.getData();
            await this.updated(data);
            this.lifecycle.showMain();
            if(this._autoClose){
                this.dialog.off();
            }
        }
        catch(err){
            this.lifecycle.showError(err);
        }
    }

    public get autoClose(): boolean{
        return this._autoClose;
    }

    public set autoClose(value: boolean){
        this._autoClose = value;
    }

    private async showItemEditorHandler(arg: ShowItemEditorEventArgs) {
        try {
            this.dialog.on();
            this.lifecycle.showLoad();
            var data = await arg.dataPromise;
            this.updated = arg.update;
            this.form.setData(data);
            this.lifecycle.showMain();
        }
        catch (err) {
            this.lifecycle.showError(err);
        }
    }

    private async setup(crudService: ICrudService) {
        try {
            var schema = await crudService.getItemSchema();
            this.form.setSchema(schema);
        }
        catch (err) {
            console.log("An error occured loading the schema for the CrudItemEditor. Message: " + err.message);
        }
    }
}

export class CrudTableRowController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, IConfirm, ICrudService, IAlert, controller.InjectControllerData];
    }

    private data: any;
    private crudService: ICrudService;
    private confirm: IConfirm;
    private alert: IAlert;

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
    public static get InjectorArgs(): controller.DiFunction<any>[] {
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
    public static get InjectorArgs(): controller.DiFunction<any>[] {
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
        this.form.setData(pageData);
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

export class CrudTableController extends ListingDisplayController<any> {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ListingDisplayOptions, ICrudService, CrudQueryManager, controller.InjectedControllerBuilder];
    }

    private crudService: ICrudService;
    private queryManager: CrudQueryManager;

    constructor(bindings: controller.BindingCollection, options: ListingDisplayOptions, crudService: ICrudService, queryManager: CrudQueryManager, private builder: controller.InjectedControllerBuilder) {
        super(bindings, options);

        this.queryManager = queryManager;
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.setup(bindings, queryManager);
    }

    private async setup(bindings: controller.BindingCollection, queryManager: CrudQueryManager) {
        await this.crudService.getPage(queryManager.setupQuery());

        await this.crudService.canAdd()
            .then(r => {
                if (!r) {
                    var addToggle = bindings.getToggle("add");
                    addToggle.off();
                }
            });
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
            this.setData(await promise);
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
    services.tryAddShared(CrudItemEditorController, CrudItemEditorController);
    services.tryAddTransient(CrudPageNumbers, CrudPageNumbers);
    services.tryAddTransient(CrudSearch, CrudSearch);
    services.tryAddShared(CrudQueryManager, s => {
        return new CrudQueryManager();
    });
}