import * as controller from 'hr.controller';
import { ListingDisplayController, ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import { IConfirm, BrowserConfirm } from 'hr.widgets.confirm';
import { IAlert, BrowserAlert } from 'hr.widgets.alert';
import * as pageWidget from 'hr.widgets.PageNumberWidget';
export { ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import * as itemEditor from 'hr.widgets.ItemEditorController';
import * as events from 'hr.eventdispatcher';
import * as schema from 'hr.widgets.SchemaConverter';

export class ShowItemEditorEventArgs {
    dataPromise: Promise<any>;
    update: itemEditor.ItemUpdatedCallback<any>

    constructor(dataPromise: Promise<any>, update: itemEditor.ItemUpdatedCallback<any>) {
        this.dataPromise = dataPromise;
        this.update = update;
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

    public abstract async add(item?: any);

    public abstract async canAdd(): Promise<boolean>;

    public abstract async edit(item: any);

    public abstract canEdit(item: any): boolean;

    public abstract getDeletePrompt(item: any): string;

    public abstract async del(item: any) : Promise<any>;

    public abstract canDel(item: any): boolean;

    public abstract getPage(query: any): void;

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

export class CrudItemEditorController extends itemEditor.ItemEditorController<any>{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ICrudService, schema.ISchemaConverter];
    }

    private schemaConverter: schema.ISchemaConverter;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, schemaConverter: schema.ISchemaConverter) {
        var settings = new itemEditor.ItemEditorSettings();
        super(bindings, settings);
        this.schemaConverter = schemaConverter;
        crudService.showItemEditorEvent.add(arg => {
            this.showItemEditorHandler(arg);
        });
        this.setup(crudService);
    }

    private async showItemEditorHandler(arg: ShowItemEditorEventArgs) {
        try {
            this.show();
            this.activateLoad();
            var data = await arg.dataPromise;
            this.editData(data, arg.update);
        }
        catch (err) {
            this.activateError(err);
        }
    }

    private async setup(crudService: ICrudService) {
        try {
            var schema = await crudService.getItemSchema();
            schema = await this.schemaConverter.convert(schema);
            this.setSchema(schema);
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

export interface SearchQuery {
    term: string;
}

export interface CrudSearchModel {
    term: string;
}

export class CrudSearch extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private queryManager: CrudQueryManager;
    private crudService: ICrudService;
    private searchModel: controller.Model<CrudSearchModel>;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager) {
        super();
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.searchModel = bindings.getModel<CrudSearchModel>("search");
    }

    public setupQuery(query: SearchQuery): void {
        var searchQuery = this.searchModel.getData();
        if (searchQuery.term !== undefined && searchQuery.term !== null && searchQuery.term !== "") {
            query.term = searchQuery.term;
        }
    }

    public runSearch(evt: Event) {
        evt.preventDefault();
        this.crudService.getPage(this.queryManager.setupQuery());
    }

    public setData(pageData: any): void {
        var model: CrudSearchModel = {
            term: pageData.data.term
        };
        if (model.term === undefined || model.term === null) {
            model.term = "";
        }
        this.searchModel.setData(model);
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

        this.crudService.getPage(queryManager.setupQuery());

        this.crudService.canAdd()
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

export interface HypermediaCrudEntryInjector {
    load(): Promise<any>;
}

export interface HypermediaCrudCollection {
    data: pageWidget.OffsetLimitTotal;
    items: any;

    refresh();
    canRefresh();

    previous();
    canPrevious();

    next();
    canNext();

    first();
    canFirst();

    last();
    canLast();
}

export interface HypermediaCrudDataResult {
    data: any;
}

export abstract class HypermediaCrudService extends ICrudService {
    private entry: HypermediaCrudEntryInjector;
    private currentPage: HypermediaCrudCollection;

    constructor(entry: HypermediaCrudEntryInjector) {
        super();
        this.entry = entry;
    }

    public async getItemSchema() {
        var entryPoint = await this.entry.load();
        var docs = await this.getActualSchema(entryPoint);
        return docs.requestSchema;
    }

    protected abstract getActualSchema(entryPoint): Promise<any>;

    public async add(item?: any) {
        if (item === undefined) {
            item = {};
        }
        this.fireShowItemEditorEvent(new ShowItemEditorEventArgs(item, a => this.finishAdd(a)));
    }

    private async finishAdd(data) {
        var entryPoint = await this.entry.load();
        await this.commitAdd(entryPoint, data);
        this.refreshPage();
    }

    protected abstract commitAdd(entryPoint, data): Promise<any>;

    public async canAdd() {
        var entryPoint = await this.entry.load();
        return this.canAddItem(entryPoint);
    }

    protected abstract canAddItem(entryPoint): boolean;

    public async edit(item: HypermediaCrudDataResult) {
        var data = this.getEditObject(item);
        this.editData(item, data);
    }

    public editData(item: HypermediaCrudDataResult, dataPromise: Promise<any>) {
        this.fireShowItemEditorEvent(new ShowItemEditorEventArgs(dataPromise, a => this.finishEdit(a, item)));
    }

    protected async getEditObject(item: HypermediaCrudDataResult) {
        return item.data;
    }

    private async finishEdit(data, item: HypermediaCrudDataResult) {
        await this.commitEdit(data, item);
        this.refreshPage();
    }

    protected abstract commitEdit(data, item: HypermediaCrudDataResult): Promise<any>;

    public async del(item: HypermediaCrudDataResult) {
        await this.commitDelete(item);
        this.refreshPage();
    }

    protected abstract commitDelete(item: HypermediaCrudDataResult): Promise<any>;

    public getPage(query: any) {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.getPageAsync(query)));
    }

    private async getPageAsync(query: any) {
        var entryResult = await this.entry.load();

        if (this.canList(entryResult)) {
            this.currentPage = await this.list(entryResult, query);
            return this.currentPage;
        }
        else {
            throw new Error("No permissions to list people, cannot get page.");
        }
    }

    protected abstract canList(entryPoint): boolean;

    protected abstract list(entryPoint, query): Promise<HypermediaCrudCollection>;

    public firstPage() {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.firstPageAsync()));
    }

    private async firstPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canFirst()) {
                this.currentPage = await this.currentPage.first();
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the first page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the first page until a page has been loaded.");
        }
    }

    public lastPage() {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.lastPageAsync()));
    }

    private async lastPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canLast()) {
                this.currentPage = await this.currentPage.last();
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the last page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the last page until a page has been loaded.");
        }
    }

    public nextPage() {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.nextPageAsync()));
    }

    private async nextPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canNext()) {
                this.currentPage = await this.currentPage.next();
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the next page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the next page until a page has been loaded.");
        }
    }

    public previousPage() {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.previousPageAsync()));
    }

    private async previousPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canPrevious()) {
                this.currentPage = await this.currentPage.previous();
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the previous page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the previous page until a page has been loaded.");
        }
    }

    public refreshPage() {
        this.fireDataLoadingEvent(new DataLoadingEventArgs(this.refreshPageAsync()));
    }

    private async refreshPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canRefresh()) {
                this.currentPage = await this.currentPage.refresh();
                return this.currentPage;
            }
            else {
                throw new Error("Cannot refresh the page, no link found.");
            }
        }
        else {
            throw new Error("Cannot refresh the page until a page has been loaded.");
        }
    }

    public getItems(list: HypermediaCrudCollection) {
        return list.items;
    }

    public getListingDisplayObject(item: HypermediaCrudDataResult) {
        return item.data;
    }

    public getPageNumberState(list: HypermediaCrudCollection) {
        return new pageWidget.HypermediaPageState(list);
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
    itemEditor.AddServices(services);
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