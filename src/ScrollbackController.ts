import * as controller from 'htmlrapier/src/controller';
import { ICrudService } from './CrudService';
import { Scope } from 'htmlrapier/src/di';

export class ScrollbackController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [ICrudService];
    }

    private onceLoading: boolean = false; //Only scrollback after the first call to this controller
    private onceMainShown: boolean = false; //Only scrollback after the first call to this controller

    constructor(private crudService: ICrudService) {
        this.crudService.dataLoadingEvent.add(a => this.onLoading());
        this.crudService.mainUiShownEvent.add(a => this.onMainShown());
    }

    private onLoading(): void {
        if (this.onceLoading) {
            this.scroll();
        }
        else {
            this.onceLoading = true;
        }
    }

    private onMainShown(): void {
        if (this.onceMainShown) {
            this.scroll();
        }
        else {
            this.onceMainShown = true;
        }
    }

    protected scroll() {
        window.scrollTo(0, 0);
    }
}

export class ElementScrollbackController extends ScrollbackController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, ICrudService];
    }

    private element: HTMLElement = null;

    constructor(bindings: controller.BindingCollection, crudService: ICrudService) {
        super(crudService);
        this.element = bindings.getHandle("scrollback");
    }

    protected scroll() {
        if (this.element !== null) {
            this.element.scrollIntoView(true);
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ElementScrollbackController, ElementScrollbackController);
    services.tryAddShared(ScrollbackController, ScrollbackController);
}

export function createControllers(builder: controller.InjectedControllerBuilder, controllerName: string): void {
    //Try to create the registered one first.
    var scrollback = builder.create(controllerName, ElementScrollbackController);
    if (scrollback.length === 0) {
        //If none are created create the default page top one instead.
        builder.createUnbound(ScrollbackController);
    }
}