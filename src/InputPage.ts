import * as controller from 'hr.controller';
import * as itemEditor from 'hr.widgets.ItemEditorController';
import * as events from 'hr.eventdispatcher';
import * as schema from 'hr.widgets.SchemaConverter';
import * as hal from 'hr.halcyon.EndpointClient';

export class SetItemSchemaEventArgs {
    constructor(public schema: any) {
        
    }
}

export class ShowItemEditorEventArgs {
    data: any;
    update: itemEditor.ItemUpdatedCallback<any>

    constructor(data: any, update: itemEditor.ItemUpdatedCallback<any>) {
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

export class InputItemEditorController extends itemEditor.ItemEditorController<any>{
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [controller.BindingCollection, IInputService, schema.ISchemaConverter];
    }

    private schemaConverter: schema.ISchemaConverter;
    private completeToggle: controller.OnOffToggle;

    constructor(bindings: controller.BindingCollection, inputService: IInputService, schemaConverter: schema.ISchemaConverter) {
        var settings = new itemEditor.ItemEditorSettings();
        super(bindings, settings);
        this.schemaConverter = schemaConverter;
        this.completeToggle = bindings.getToggle("complete");
        this.completeToggle.off();
        inputService.dataLoading.add(arg => {
            this.activateLoad();
        });
        inputService.showItemEditorEvent.add(arg => {
            this.editData(arg.data, arg.update);
        });
        inputService.setItemSchema.add(arg => {
            var schema = this.schemaConverter.convert(arg.schema);
            this.setSchema(schema);
        });
        inputService.inputCompleted.add(() => {
            this.setSchema({});
            this.activateOtherToggle(this.completeToggle);
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

interface HypermediaInputPageResult {
    data: any;

    previous(): Promise<HypermediaInputPageResult>;

    canPrevious(): boolean;

    next(): Promise<HypermediaInputPageResult>;

    canNext(): boolean;

    save(data: any): Promise<HypermediaInputPageResult>;

    canSave(): boolean;

    getSaveDocs(): Promise<hal.HalEndpointDoc>;

    hasSaveDocs(): boolean;
}

export abstract class HypermediaInputService extends IInputService {
    private page: HypermediaInputPageResult;

    public canNext(): boolean {
        return this.page.canNext();
    }

    public next() {
        this.setPage(this.page.next());
    }

    public canPrevious(): boolean {
        return this.page.canPrevious();
    }

    public previous() {
        this.setPage(this.page.previous());
    }

    protected async setPage(pagePromise: Promise<HypermediaInputPageResult>) {
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
        if (savedResult.canNext()) {
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
    itemEditor.AddServices(services);
    services.tryAddScoped(InputItemEditorController, InputItemEditorController);
    services.tryAddScoped(InputPagesController, InputPagesController);
}