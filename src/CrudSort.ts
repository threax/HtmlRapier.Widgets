import { CrudQueryManager, ICrudQueryComponent, QueryEventArgs } from 'hr.widgets.CrudQuery';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import * as toggles from 'hr.toggles';

class ColumnOrderToggle extends toggles.TypedToggle {
    public getPossibleStates(): string[] {
        return ['asc', 'desc', 'off'];
    }
}

type ColumnToggleMap = { [key: string]: ColumnOrderToggle };

export class CrudSort extends ICrudQueryComponent {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService, CrudQueryManager];
    }

    private orderBy: string;
    private orderAsc: boolean = true;
    private orderToggles: toggles.Group;
    private loadedToggles: ColumnToggleMap = {};

    constructor(private bindings: controller.BindingCollection, private crudService: ICrudService, private queryManager: CrudQueryManager) {
        super();
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.queryManager.addComponent(this);
        this.orderToggles = new toggles.Group();
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
        this.handleSortIcons();
    }

    public sort(evt: Event): void {
        evt.preventDefault();
        var newSortColumn = (<HTMLElement>evt.target).getAttribute("data-hr-sort-name");
        if(this.orderBy === newSortColumn){
            this.orderAsc = !this.orderAsc;
        }
        else{
            this.orderAsc = true;
        }
        this.orderBy = newSortColumn;

        this.crudService.getPage(this.queryManager.setupQuery());
        this.handleSortIcons();
    }

    private handleSortIcons() {
        var toggleName = this.orderBy + "OrderToggle";
        var columnToggle: ColumnOrderToggle;
        if (this.loadedToggles[toggleName] === undefined) {
            columnToggle = this.bindings.getCustomToggle(toggleName, new ColumnOrderToggle());
            this.loadedToggles[toggleName] = columnToggle;
            this.orderToggles.add(columnToggle);
        }
        else {
            columnToggle = this.loadedToggles[toggleName];
        }
        var orderName = "desc";
        if (this.orderAsc) {
            orderName = "asc";
        }
        this.orderToggles.activate(columnToggle, orderName, "off");
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