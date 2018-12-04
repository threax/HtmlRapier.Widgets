import { ListingDisplayController, ListingDisplayOptions } from 'hr.widgets.ListingDisplayController';
import * as controller from 'hr.controller';
import { ICrudService } from 'hr.widgets.CrudService';
import { CrudQueryManager } from 'hr.widgets.CrudQuery';
import { CrudTableRowController } from 'hr.widgets.CrudTableRow';
import * as view from 'hr.view';

export class CrudPageViewOptions{
    viewName: string = "display";
}

/**
 * A simple class that can output the current page data to the screen easily.
 */
export class CrudPageView {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, CrudPageViewOptions, ICrudService];
    }

    private crudService: ICrudService;
    private dataView: controller.IView<any>;

    constructor(bindings: controller.BindingCollection, options: CrudPageViewOptions, crudService: ICrudService) {
        this.crudService = crudService;
        this.crudService.dataLoadingEvent.add(a => this.handlePageLoad(a.data));
        this.dataView = bindings.getView(options.viewName);
    }

    private async handlePageLoad(promise: Promise<any>) {
        try {
            var data = await promise; //Important to await this first

            this.dataView.setData(data);
        }
        catch (err) {
            console.log("Error loading crud page view data. Message: " + err.message);
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudPageView, CrudPageView);
    services.tryAddSharedInstance(CrudPageViewOptions, new CrudPageViewOptions());
}