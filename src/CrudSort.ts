import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';

export class CrudSort extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private orderBy: string;
    private orderAsc: boolean = true;

    constructor(bindings: controller.BindingCollection, private crudService: ICrudService, private queryManager: CrudQueryManager) {
        super();
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager.addComponent(this);
    }

    public setupQuery(query: any): void {
        query["orderBy"] = this.orderBy;
        if(this.orderAsc){
            query["order"] = "Ascending";
        }
        else{
            query["order"] = "Descending";
        }
    }

    public setData(pageData: any): void {
        var strongData = this.crudService.getSearchObject(pageData);
        this.orderBy = strongData.orderBy;
        this.orderAsc = strongData.order !== "Descending";
    }

    public sort(evt: Event): void {
        evt.preventDefault();
        var newSortColumn = evt.srcElement.getAttribute("data-hr-sort-name");
        if(this.orderBy === newSortColumn){
            this.orderAsc = !this.orderAsc;
        }
        else{
            this.orderAsc = true;
        }
        this.orderBy = newSortColumn;

        this.crudService.getPage(this.queryManager.setupQuery());
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
    services.tryAddTransient(CrudSort, CrudSort);
}