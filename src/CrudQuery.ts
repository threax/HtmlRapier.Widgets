import * as events from 'htmlrapier/src/eventdispatcher';
import * as controller from 'htmlrapier/src/controller';

export class QueryEventArgs {
    private _query: any;

    constructor(query: any) {
        this._query = query;
    }

    public get query() {
        return this._query;
    }
}

export class CrudQueryManager {
    private loadPageDispatcher = new events.ActionEventDispatcher<QueryEventArgs>();
    private components: ICrudQueryComponent[] = [];

    public get loadPageEvent() {
        return this.loadPageDispatcher.modifier;
    }

    public addComponent(component: ICrudQueryComponent) {
        this.components.push(component);
        component.loadPageEvent.add(a => this.fireLoadPageEvent());
    }

    private fireLoadPageEvent() {
        var query = {};
        for (var i = 0; i < this.components.length; ++i) {
            this.components[i].setupQuery(query);
        }
        this.loadPageDispatcher.fire(new QueryEventArgs(query));
    }

    public setupQuery(): any {
        var query = {};
        for (var i = 0; i < this.components.length; ++i) {
            this.components[i].setupQuery(query);
        }
        return query;
    }
}

export abstract class ICrudQueryComponent {
    private loadPageDispatcher = new events.ActionEventDispatcher<void>();

    public get loadPageEvent() {
        return this.loadPageDispatcher.modifier;
    }

    protected fireLoadPage() {
        this.loadPageDispatcher.fire(undefined);
    }

    public abstract setupQuery(query: any): void;
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(CrudQueryManager, s => {
        return new CrudQueryManager();
    });
}