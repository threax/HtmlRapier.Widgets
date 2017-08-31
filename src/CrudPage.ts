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
    private _dialog: controller.OnOffToggle;
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
        this._dialog = bindings.getToggle(options.dialogName);
        this._dialog.offEvent.add(i => !this.closed || this.closed());
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
            this._dialog.off();
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
                this._dialog.off();
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

    public get dialog(): controller.OnOffToggle {
        return this._dialog;
    }

    private async showItemEditorHandler(arg: ShowItemEditorEventArgs) {
        this.mainErrorToggle.off();
        try {
            this._dialog.on();
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