import * as controller from 'hr.controller';
import * as events from 'hr.eventdispatcher';
import * as hal from 'hr.halcyon.EndpointClient';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as form from 'hr.form';
import { JsonSchema } from 'hr.schema';
import * as error from 'hr.error';

export class CrudItemEditorControllerOptions {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [];
    }

    public mainErrorToggleName = "mainError";
    public mainErrorViewName = "mainError";
    public mainToggleName = "main";
    public loadToggleName = "load";
    public errorToggleName = "error";
    public formName = "input";
    public completeToggleName = "complete";
}

export abstract class IInputService {
    public abstract getSchema(): Promise<JsonSchema>;

    public abstract getData(): Promise<{} | undefined>;

    public abstract submitData(data: {}): Promise<boolean>;
}

export class InputItemEditorControllerExtensions {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [];
    }

    /**
     * This function is called when the data is finished being input and the InputItemEditorController is about to display
     * the complete page.
     * @param data
     * @param source
     */
    public async inputCompleted(data: any, source: InputItemEditorController): Promise<void> {

    }
}

export class InputItemEditorController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection,
                IInputService,
                InputItemEditorControllerExtensions
                /*Options here, must call constructor manually unless defaults are ok. Leave options last.*/];
    }

    private completeToggle: controller.OnOffToggle;
    private lifecycle: MainLoadErrorLifecycle;
    private form: controller.IForm<any>;
    private mainErrorToggle: controller.OnOffToggle;
    private mainErrorView: controller.IView<Error>;

    constructor(bindings: controller.BindingCollection, private inputService: IInputService, private extensions: InputItemEditorControllerExtensions, options: CrudItemEditorControllerOptions) {
        if (options === undefined) {
            options = new CrudItemEditorControllerOptions();
        }

        this.completeToggle = bindings.getToggle(options.completeToggleName);
        this.completeToggle.off();
        this.form = new form.NeedsSchemaForm<any>(bindings.getForm<any>(options.formName));
        this.mainErrorToggle = bindings.getToggle(options.mainErrorToggleName);
        this.mainErrorView = bindings.getView<Error>(options.mainErrorViewName);

        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(options.mainToggleName),
            bindings.getToggle(options.loadToggleName),
            bindings.getToggle(options.errorToggleName),
            true);

        this.setup();
    }

    private async setup(): Promise<void> {
        this.lifecycle.showLoad();
        try {
            var data = await this.inputService.getData();
            var schema = await this.inputService.getSchema();

            this.form.setSchema(schema);
            this.form.setData(data);

            this.lifecycle.showMain();
        }
        catch (err) {
            this.lifecycle.showError(err);
        }
    }

    public async submit(evt: Event): Promise<void> {
        evt.preventDefault();
        this.lifecycle.showLoad();
        try {
            var data = this.form.getData();
            if (await this.inputService.submitData(data)) {
                this.setup();
            }
            else {
                await this.extensions.inputCompleted(data, this);
                this.lifecycle.showOther(this.completeToggle);
            }
        }
        catch (err) {
            if (error.isFormErrors(err)) {
                this.form.setError(err);
                this.lifecycle.showMain();
                this.mainErrorView.setData(err);
                this.mainErrorToggle.on();
            }
            else {
                this.lifecycle.showError(err);
            }
        }
    }
}

export interface HypermediaInputResult {
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

export abstract class HypermediaInputServiceInjector {
    public abstract getStart(): Promise<HypermediaInputResult>;
}

export class HypermediaInputService extends IInputService {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [HypermediaInputServiceInjector];
    }

    private current: HypermediaInputResult = null;

    constructor(private injector: HypermediaInputServiceInjector) {
        super();
    }

    public async getSchema(): Promise<JsonSchema> {
        if (this.current !== null) {
            return (await this.current.getSaveDocs()).requestSchema;
        }
        return null;
    }

    public async getData(): Promise<{} | undefined> {
        if (this.current === null) {
            this.current = await this.injector.getStart();
        }
        return this.current.data;
    }

    public async submitData(data: {}): Promise<boolean> {
        this.current = await this.current.save(data);
        return IsNextResult(this.current);
    }
}

/**
 * This function will define a service for InputItemEditorController, it expects that you
 * will provide a IInputService implementation in order to work.
 * @param services
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddTransient(InputItemEditorControllerExtensions, InputItemEditorControllerExtensions);
    services.tryAddTransient(InputItemEditorController, InputItemEditorController);
    services.tryAddTransient(IInputService, HypermediaInputService);
}