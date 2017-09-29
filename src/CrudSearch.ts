import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import * as form from 'hr.form';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';

export class CrudSearch extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private queryManager: CrudQueryManager;
    private crudService: ICrudService;
    private form: controller.IForm<any>;
    private lifecycle: MainLoadErrorLifecycle;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager) {
        super();

        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle("main"),
            bindings.getToggle("load"),
            bindings.getToggle("error"),
            true);

        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.form = new form.NeedsSchemaForm(bindings.getForm<any>("input"));
        this.setup(bindings, crudService);
    }

    private async setup(bindings: controller.BindingCollection, crudService: ICrudService) {
        try {
            this.lifecycle.showLoad();
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
            this.lifecycle.showMain();
        }
        catch (err) {
            this.lifecycle.showError(err);
        }
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

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudSearch, CrudSearch);
}