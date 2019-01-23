import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import { CrudQueryManager } from 'hr.widgets.CrudQuery';
import { CrudTableRowController } from 'hr.widgets.CrudTableRow';
import * as view from 'hr.view';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as components from 'hr.components';

export class ListingDisplayOptions {
    listingModelName: string = "listing";
    mainToggleName: string = "main";
    errorToggleName: string = "error";
    loadToggleName: string = "load";
    setLoadingOnStart: boolean = true;
}

export class CrudTableControllerExtensions {

    /**
     * If you need access to the binding collection for the table, get it here.
     * @param bindings The binding collection for the table.
     */
    public setupBindings(bindings: controller.BindingCollection): void {
        
    }

    /**
     * Determine the view variant to use. The external data is passed as well.
     * @param item
     * @param external
     */
    public getVariant(item: any, external?: any): string {
        return null;
    }

    /**
     * Get an object that will be sent to the view for your object. You can apply any additional formatting
     * here and lookup values from your external data.
     * @param display The version of the object the crud service has accessed.
     * @param original The data object that was originally passed in.
     * @param external The external data you loaded in loadExternalData, will be null if you didnt load anything.
     */
    public getDisplayObject(display: any, original: any, external?: any): any {
        return display;
    }

    /**
     * Load any external data that is needed for building display objects. This is called when the data for a page
     * is first loaded. You should store your results and return them from this funciton, this will pass the value
     * you return to getDisplayObject when getting the final version of your object you want to display.
     * By default this returns null.
     * @param pageData
     */
    public async loadExternalData(pageData: any): Promise<any> {
        return Promise.resolve(null);
    }
}

export class CrudTableController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ListingDisplayOptions, ICrudService, CrudQueryManager, controller.InjectedControllerBuilder, CrudTableControllerExtensions];
    }

    private crudService: ICrudService;
    private queryManager: CrudQueryManager;
    private addToggle: controller.OnOffToggle;
    private lookupDisplaySchema = true;
    private listingModel: controller.IView<any>;
    private lifecycle: MainLoadErrorLifecycle;

    constructor(bindings: controller.BindingCollection, options: ListingDisplayOptions, crudService: ICrudService, queryManager: CrudQueryManager, private builder: controller.InjectedControllerBuilder, private extensions: CrudTableControllerExtensions) {
        this.listingModel = bindings.getView<any>(options.listingModelName);
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(options.mainToggleName),
            bindings.getToggle(options.loadToggleName),
            bindings.getToggle(options.errorToggleName),
            options.setLoadingOnStart);

        this.extensions.setupBindings(bindings);
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

    public async setData(pageData: any): Promise<void> {
        var external = await this.extensions.loadExternalData(pageData);
        var items = this.crudService.getItems(pageData);
        this.clearData();
        var listingCreator = this.builder.createOnCallback(CrudTableRowController);
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var itemData = this.extensions.getDisplayObject(this.crudService.getListingDisplayObject(item), item, external);
            this.appendData(itemData, (b, d) => {                
                listingCreator(b, item);
            }, v => this.extensions.getVariant(item, external));
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

            await this.setData(data);

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

    public clearData() {
        this.listingModel.clear();
    }

    public setFormatter(formatter: view.IViewDataFormatter<any>): void {
        this.listingModel.setFormatter(formatter);
    }

    public appendData(data: any | any[], createdCallback?: components.CreatedCallback<any>, variantFinderCallback?: components.VariantFinderCallback<any>) {
        this.listingModel.appendData(data, createdCallback, variantFinderCallback);
    }

    public showMain() {
        this.lifecycle.showMain();
    }

    public showLoad() {
        this.lifecycle.showLoad();
    }

    public showError(error: Error) {
        this.lifecycle.showError(error);
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudTableControllerExtensions, s => new CrudTableControllerExtensions());
    services.tryAddTransient(CrudTableController, CrudTableController);
    services.tryAddSharedInstance(ListingDisplayOptions, new ListingDisplayOptions());
}