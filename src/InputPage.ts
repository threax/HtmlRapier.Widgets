import * as controller from 'hr.controller';
import * as events from 'hr.eventdispatcher';
import * as hal from 'hr.halcyon.EndpointClient';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as form from 'hr.form';

export class SetItemSchemaEventArgs {
    constructor(public schema: any) {
        
    }
}

export class ShowItemEditorEventArgs {
    data: any;
    update: ItemUpdatedCallback

    constructor(data: any, update: ItemUpdatedCallback) {
        this.data = data;
        this.update = update;
    }
}

export class DataLoadingEventArgs {
    private _dataPromise: Promise<any>;

    constructor(dataPromise: Promise<any>) {
        this._dataPromise = dataPromise;
    }

    public get data(): Promise<any> {
        return this._dataPromise;
    }
}

export type ItemUpdatedCallback = (data: any) => Promise<any>;

export abstract class IInputService {
    private showItemEditorDispatcher = new events.ActionEventDispatcher<ShowItemEditorEventArgs>();
    private setItemSchemaDispatcher = new events.ActionEventDispatcher<SetItemSchemaEventArgs>();
    private inputCompleteDispatcher = new events.ActionEventDispatcher<void>();
    private dataLoadingDispatcher = new events.ActionEventDispatcher<void>();

    public abstract canNext(): boolean;

    public abstract next(): void;

    public abstract canPrevious(): boolean;

    public abstract previous(): void;

    public get showItemEditorEvent() {
        return this.showItemEditorDispatcher.modifier;
    }

    protected fireShowItemEditorEvent(args: ShowItemEditorEventArgs) {
        this.showItemEditorDispatcher.fire(args);
    }

    public get setItemSchema() {
        return this.setItemSchemaDispatcher.modifier;
    }

    protected fireSetItemSchema(args: SetItemSchemaEventArgs) {
        this.setItemSchemaDispatcher.fire(args);
    }

    public get dataLoading() {
        return this.dataLoadingDispatcher.modifier;
    }

    protected fireDataLoading() {
        this.dataLoadingDispatcher.fire(undefined);
    }

    public get inputCompleted() {
        return this.inputCompleteDispatcher.modifier;
    }

    protected fireInputCompleted() {
        this.inputCompleteDispatcher.fire(undefined);
    }
}

export class InputItemEditorController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, IInputService];
    }

    private completeToggle: controller.OnOffToggle;
    private lifecycle: MainLoadErrorLifecycle;
    private form: controller.IForm<any>;
    private update: ItemUpdatedCallback;

    constructor(bindings: controller.BindingCollection, inputService: IInputService) {
        this.completeToggle = bindings.getToggle("complete");
        this.completeToggle.off();
        this.form = new form.NeedsSchemaForm<any>(bindings.getForm<any>("input"));

        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle("main"),
            bindings.getToggle("load"),
            bindings.getToggle("error"),
            true);

        inputService.dataLoading.add(arg => {
            this.lifecycle.showLoad();
        });
        inputService.showItemEditorEvent.add(arg => {
            this.update = arg.update;
            this.form.setData(arg.data);
            this.lifecycle.showMain();
        });
        inputService.setItemSchema.add(arg => {
            this.form.setSchema(arg.schema);
        });
        inputService.inputCompleted.add(() => {
            //this.setSchema({});
            this.lifecycle.showOther(this.completeToggle);
        });
    }
}

export class InputPagesController {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, IInputService];
    }

    private nextToggle: controller.OnOffToggle;
    private previousToggle: controller.OnOffToggle;

    private service: IInputService;

    public constructor(bindings: controller.BindingCollection, service: IInputService) {
        this.service = service;
        this.nextToggle = bindings.getToggle("next");
        this.nextToggle.off();
        this.previousToggle = bindings.getToggle("previous");
        this.previousToggle.off();
        service.showItemEditorEvent.add(d => this.setState());
    }

    private setState() {
        this.nextToggle.mode = this.service.canNext();
        this.previousToggle.mode = this.service.canPrevious();
    }

    public next(evt: Event) {
        evt.preventDefault();
        this.service.next();
    }

    public previous(evt: Event) {
        evt.preventDefault();
        this.service.previous();
    }
}

interface HypermediaInputResult {
    data: any;

    save(data: any): Promise<HypermediaInputResult>;

    canSave(): boolean;

    getSaveDocs(): Promise<hal.HalEndpointDoc>;

    hasSaveDocs(): boolean;
}

interface HypermediaPreviousInputResult {
    previous(): Promise<HypermediaInputResult>;

    canPrevious(): boolean;
}

function IsPreviousResult(t: any): t is HypermediaPreviousInputResult {
    return t && (<HypermediaPreviousInputResult>t).canPrevious !== undefined && (<HypermediaPreviousInputResult>t).previous !== undefined;
}

interface HypermediaNextInputResult {
    next(): Promise<HypermediaInputResult>;

    canNext(): boolean;
}

function IsNextResult(t: any): t is HypermediaNextInputResult {
    return t && (<HypermediaNextInputResult>t).canNext !== undefined && (<HypermediaNextInputResult>t).next !== undefined;
}

export abstract class HypermediaInputService extends IInputService {
    private page: HypermediaInputResult;

    public canNext(): boolean {
        return IsNextResult(this.page) && this.page.canNext();
    }

    public next() {
        if (IsNextResult(this.page)) {
            this.setPage(this.page.next());
        }
    }

    public canPrevious(): boolean {
        return IsPreviousResult(this.page) && this.page.canPrevious();
    }

    public previous() {
        if (IsPreviousResult(this.page)) {
            this.setPage(this.page.previous());
        }
    }

    protected async setPage(pagePromise: Promise<HypermediaInputResult>) {
        this.fireDataLoading();
        this.page = await pagePromise;
        if (this.page.canSave()) {
            var docs = await this.page.getSaveDocs();
            this.fireSetItemSchema(new SetItemSchemaEventArgs(docs.requestSchema));
            this.fireShowItemEditorEvent(new ShowItemEditorEventArgs(this.page.data, d => this.setData(d)));
        }
        else {
            throw new Error("Cannot save input. Does the user have permission?");
        }
    }

    protected async setData(data: any) {
        var savedResult = await this.page.save(data);
        if (IsNextResult(savedResult) && savedResult.canNext()) {
            var next = savedResult.next();
            this.setPage(next);
        }
        else {
            this.fireInputCompleted();
        }
    }
}

/**
 * This function will define a service for InputItemEditorController, it expects that you
 * will provide a IInputService implementation in order to work.
 * @param services
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddTransient(InputItemEditorController, InputItemEditorController);
    services.tryAddTransient(InputPagesController, InputPagesController);
}