import * as controller from 'hr.controller';
import * as events from 'hr.eventdispatcher';
import * as hal from 'hr.halcyon.EndpointClient';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as form from 'hr.form';
import { JsonSchema } from 'hr.schema';
import * as error from 'hr.error';

/**
 * The config for the controller from markup.
 */
interface GetSetControllerConfig {
    keepform: string;
}

export class GetSetControllerOptions {
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

export abstract class IGetSetService {
    public abstract getSchema(): Promise<JsonSchema>;

    public abstract getData(): Promise<{} | undefined>;

    public abstract setData(data: {}): Promise<HypermediaInputResult | void>;
}

export class GetSetControllerExtensions {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [];
    }

    public constructed(bindings: controller.BindingCollection, source: GetSetController): void {

    }

    /**
     * This function is called when the data is finished being input and the InputItemEditorController is about to display
     * the complete page.
     * @param data
     * @param source
     */
    public async inputCompleted(data: any, source: GetSetController): Promise<void> {

    }

    /**
     * This function is called when the data set on the server and the InputItemEditorController is about to display
     * the complete page. This will send the HypermediaInputResult as the data argument.
     * @param data
     * @param source
     */
    public async setCompleted(data: HypermediaInputResult, source: GetSetController): Promise<void> {

    }
}

export class GetSetController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection,
                IGetSetService,
                GetSetControllerExtensions
                /*Options here, must call constructor manually unless defaults are ok. Leave options last.*/];
    }

    private completeToggle: controller.OnOffToggle;
    private lifecycle: MainLoadErrorLifecycle;
    private form: controller.IForm<any>;
    private mainErrorToggle: controller.OnOffToggle;
    private mainErrorView: controller.IView<Error>;
    private keepMainFormVisible: boolean;

    constructor(bindings: controller.BindingCollection, private inputService: IGetSetService, private extensions: GetSetControllerExtensions, options: GetSetControllerOptions) {
        if (options === undefined) {
            options = new GetSetControllerOptions();
        }

        var config = bindings.getConfig<GetSetControllerConfig>();

        this.keepMainFormVisible = config.keepform !== "false";
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

        bindings.setListener(this.extensions);
        this.extensions.constructed(bindings, this);
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
        this.mainErrorToggle.off();
        this.completeToggle.off();
        try {
            var data = this.form.getData() || {}; //Form returns null, but to get errors must send something
            var setResult = await this.inputService.setData(data);
            if(setResult) {
                await this.extensions.setCompleted(setResult, this);
            }
            await this.extensions.inputCompleted(data, this);
            if (this.keepMainFormVisible) {
                data = await this.inputService.getData()
                this.form.setData(data);
                this.lifecycle.showMain();
                this.completeToggle.on();
            }
            else {
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

    set(data: any): Promise<HypermediaInputResult>;

    canSet(): boolean;

    getSetDocs(): Promise<hal.HalEndpointDoc>;

    hasSetDocs(): boolean;
}

export abstract class HypermediaGetSetInjector {
    public abstract getStart(): Promise<HypermediaInputResult>;
}

export class HypermediaGetSetService extends IGetSetService {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [HypermediaGetSetInjector];
    }

    private current: HypermediaInputResult = null;

    constructor(private injector: HypermediaGetSetInjector) {
        super();
    }

    public async getSchema(): Promise<JsonSchema> {
        if (this.current !== null) {
            return (await this.current.getSetDocs()).requestSchema;
        }
        return null;
    }

    public async getData(): Promise<{} | undefined> {
        if (this.current === null) {
            this.current = await this.injector.getStart();
        }
        return this.current.data;
    }

    public async setData(data: {}): Promise<HypermediaInputResult | void> {
        this.current = await this.current.set(data);
        return this.current;
    }
}

/**
 * This function will define a service for InputItemEditorController, it expects that you
 * will provide a IInputService implementation in order to work.
 * @param services
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddTransient(GetSetControllerExtensions, GetSetControllerExtensions);
    services.tryAddTransient(GetSetController, GetSetController);
    services.tryAddTransient(IGetSetService, HypermediaGetSetService);
}