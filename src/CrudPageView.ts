import * as controller from 'htmlrapier/src/controller';
import { ICrudService } from './CrudService';
import { CrudQueryManager } from './CrudQuery';
import { CrudTableRowController } from './CrudTableRow';
import * as view from 'htmlrapier/src/view';

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