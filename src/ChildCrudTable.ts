import * as crudPage from './CrudPage';
import * as hyperCrudPage from './HypermediaCrudService';
import * as controller from 'htmlrapier/src/controller';
import * as hyperCrud from './HypermediaCrudService';

export interface CrudResultHandler {
    setCurrent(result: hyperCrud.HypermediaCrudDataResult): void;

    refresh(): void;
}

export class ChildCrudTable {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [crudPage.ICrudService, hyperCrudPage.HypermediaPageInjector, crudPage.CrudQueryManager];
    }

    constructor(private crudService: crudPage.ICrudService, private injector: hyperCrud.AbstractHypermediaChildPageInjector<hyperCrud.HypermediaCrudDataResult>, private queryManager: crudPage.CrudQueryManager) {
        this.crudService.crudDataModifiedEvent.add(a => this.crudServiceLoading(a));
    }

    private resultHandlers: CrudResultHandler[] = [];

    public setCurrent(result: hyperCrud.HypermediaCrudDataResult): void {
        this.injector.parent = result;
        this.crudService.getPage(this.queryManager.setupQuery());
        for (var i = 0; i < this.resultHandlers.length; ++i) {
            this.resultHandlers[i].setCurrent(result);
        }
    }

    public addResultHandler(handler: CrudResultHandler) {
        this.resultHandlers.push(handler);
    }

    private async crudServiceLoading(a: any) {
        var data = await a.data;
        for (var i = 0; i < this.resultHandlers.length; ++i) {
            this.resultHandlers[i].refresh();
        }
    }
}