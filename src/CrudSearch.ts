import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from './CrudQuery';
import * as controller from 'htmlrapier/src/controller';
import { ICrudService } from './CrudService';
import * as form from 'htmlrapier/src/form';
import { MainLoadErrorLifecycle } from './MainLoadErrorLifecycle';
import { serialize } from 'htmlrapier/src/formhelper';
import * as error from 'htmlrapier/src/error';

export abstract class ICrudSearchOptions {
    public allowAutoSearch?: boolean;
    public loadToggleName?: string;
    public mainToggleName?: string;
    public errorToggleName?: string;
    public queryErrorViewName?: string;
    public queryErrorToggleName?: string;
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

    /**
     * This is called when data is about to be set on the search form.
     * You can return true to allow the data to be set or false to cancel
     * it if needed. The default implementation always returns true.
     * @param pageData
     */
    public onSetData(pageData: any): boolean {
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
    private queryErrorView: controller.IView<string>;
    private queryErrorToggle: controller.OnOffToggle;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService, queryManager: CrudQueryManager, options: ICrudSearchOptions, private extensions: CrudSearchExtensions) {
        super();

        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(options.mainToggleName || "main"),
            bindings.getToggle(options.loadToggleName || "load"),
            bindings.getToggle(options.errorToggleName || "error"),
            true);

        this.allowAutoSearch = options.allowAutoSearch;
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager = queryManager;
        this.queryManager.addComponent(this);
        this.form = new form.NeedsSchemaForm(bindings.getForm<any>("input"));
        this.queryErrorView = bindings.getView(options.queryErrorViewName || "queryError");
        this.queryErrorToggle = bindings.getToggle(options.queryErrorToggleName || "queryError");
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

    public reset(evt: Event) {
        evt.preventDefault();
        this.clearData({});
    }

    public async triggerSearch(): Promise<any> {
        this.form.clearError();
        this.queryErrorToggle.off();
        try {
            return await this.crudService.getPage(this.queryManager.setupQuery());
        }
        catch (err) {
            if (error.isFormErrors(err)) {
                this.form.setError(err);
                if (err.message) {
                    this.queryErrorToggle.on();
                    this.queryErrorView.setData(err.message);
                }
            }
            throw err;
        }
    }

    public clearData(clearData?: any) {
        if (clearData === undefined) {
            clearData = null;
        }
        this.doSetData(clearData);
    }

    public setData(pageData: any): void {
        if (this.extensions.onSetData(pageData)) {
            this.doSetData(this.crudService.getSearchObject(pageData));
        }
    }

    private doSetData(data: any): void {
        var allowSearch = this.allowAutoSearch;
        this.allowAutoSearch = false;
        this.form.setData(data);
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