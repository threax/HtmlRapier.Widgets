import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import * as form from 'hr.form';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import { serialize } from 'htmlrapier/src/formhelper';

export abstract class ICrudSearchOptions {
    public allowAutoSearch?: boolean;
}

export class CrudSearchExtensions {
    public constructed(search: CrudSearch, bindings: controller.BindingCollection): void {

    }

    public setup(search: CrudSearch): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * This is called when an auto search is going to be performed. Return
     * true to do the search and false to skip it. Default implementation
     * always returns true. This will only fire if you enabled allowAutoSearch
     * in the options.
     * @param args
     */
    public onAutoSearch(args: form.IFormChangedArgs<any>): boolean {
        return true;
    }
}

export class CrudSearch extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager, ICrudSearchOptions, CrudSearchExtensions];
    }

    private queryManager: CrudQueryManager;
    private crudService: ICrudService;
    private form: controller.IForm<any>;
    private lifecycle: MainLoadErrorLifecycle;
    private allowAutoSearch: boolean;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager, options: ICrudSearchOptions, private extensions: CrudSearchExtensions) {
        super();

        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle("main"),
            bindings.getToggle("load"),
            bindings.getToggle("error"),
            true);

        this.allowAutoSearch = options.allowAutoSearch;
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.form = new form.NeedsSchemaForm(bindings.getForm<any>("input"));
        this.extensions.constructed(this, bindings);
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
            this.form.onChanged.add(a => {
                if (this.allowAutoSearch && this.extensions.onAutoSearch(a)) {
                    this.crudService.getPage(this.queryManager.setupQuery());
                }
            });
            await this.extensions.setup(this);
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
        this.triggerSearch();
    }

    public triggerSearch(): Promise<any> {
        return this.crudService.getPage(this.queryManager.setupQuery());
    }

    public clearForm(clearData?: any) {
        if (clearData === undefined) {
            clearData = {};
        }
        this.form.setData(clearData);
    }

    public setData(pageData: any): void {
        var allowSearch = this.allowAutoSearch;
        this.allowAutoSearch = false;
        this.form.setData(this.crudService.getSearchObject(pageData));
        this.allowAutoSearch = allowSearch;
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
    services.tryAddShared(ICrudSearchOptions, s => {
        return {
            allowAutoSearch: false
        }
    });
    services.tryAddTransient(CrudSearchExtensions, s => new CrudSearchExtensions());
    services.tryAddTransient(CrudSearch, CrudSearch);
}