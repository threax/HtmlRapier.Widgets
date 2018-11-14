import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';

export class CrudSort extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private orderBy: string;

    constructor(bindings: controller.BindingCollection, private crudService: ICrudService, private queryManager: CrudQueryManager) {
        super();
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager.addComponent(this);
    }

    public setupQuery(query: any): void {
        query["orderBy"] = this.orderBy;
    }

    public setData(pageData: any): void {
        this.orderBy = this.crudService.getSearchObject(pageData).sortColumn;
    }

    private async handlePageLoad(promise: Promise<any>) {
        try {
            this.setData(await promise);
        }
        catch (err) {
            console.log("Error loading crud table data for search. Message: " + err.message);
        }
    }

    public sort(evt: Event): void {
        evt.preventDefault();
        this.orderBy = evt.srcElement.getAttribute("data-column-name");
        this.crudService.getPage(this.queryManager.setupQuery());
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudSort, CrudSort);
}