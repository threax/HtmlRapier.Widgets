import { ListingDisplayController, ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import { CrudQueryManager } from 'hr.widgets.CrudQuery';
import { CrudTableRowController } from 'hr.widgets.CrudTableRow';
import * as view from 'hr.view';

export class CrudTableControllerExtensions {
    public getVariant(item: any): string {
        return null;
    }

    public getDisplayObject(display: any, original: any): any {
        return display;
    }
}

export class CrudTableController extends ListingDisplayController<any> {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ListingDisplayOptions, ICrudService, CrudQueryManager, controller.InjectedControllerBuilder, CrudTableControllerExtensions];
    }

    private crudService: ICrudService;
    private queryManager: CrudQueryManager;
    private addToggle: controller.OnOffToggle;
    private lookupDisplaySchema = true;

    constructor(bindings: controller.BindingCollection, options: ListingDisplayOptions, crudService: ICrudService, queryManager: CrudQueryManager, private builder: controller.InjectedControllerBuilder, private extensions: CrudTableControllerExtensions) {
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
            var item = items[i];
            var itemData = this.extensions.getDisplayObject(this.crudService.getListingDisplayObject(item), item);
            this.appendData(itemData, (b, d) => {                
                listingCreator(b, item);
            }, v => this.extensions.getVariant(item));
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

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudTableControllerExtensions, s => new CrudTableControllerExtensions());
    services.tryAddTransient(CrudTableController, CrudTableController);
    services.tryAddSharedInstance(ListingDisplayOptions, new ListingDisplayOptions());
}