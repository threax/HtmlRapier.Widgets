import * as controller from 'hr.controller';
import * as form from 'hr.form';
import { ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs } from 'hr.widgets.CrudService';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as error from 'hr.error';

export class ScrollbackController {
    onLoading(): void {

    }

    onMainShown(): void {

    }
}

export class WindowTopScrollbackController extends ScrollbackController {
    private once: boolean = false; //Only scrollback after the first call to this controller

    onLoading(): void {
        if (this.once) {
            window.scrollTo(0, 0);
        }
        else {
            this.once = true;
        }
    }
}

export class ElementScrollbackController extends ScrollbackController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection];
    }

    private onceLoading: boolean = false; //Only scrollback after the first call to this controller
    private onceMainShown: boolean = false; //Only scrollback after the first call to this controller
    private element: HTMLElement = null;

    constructor(bindings: controller.BindingCollection) {
        super();
        this.element = bindings.getHandle("scrollback");
    }

    onLoading(): void {
        if (this.onceLoading) {
            this.scroll();
        }
        else {
            this.onceLoading = true;
        }
    }

    onMainShown(): void {
        if (this.onceMainShown) {
            this.scroll();
        }
        else {
            this.onceMainShown = true;
        }
    }

    private scroll() {
        if (this.element === null) {
            window.scrollTo(0, 0);
        }
        else {
            this.element.scrollIntoView(true);
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ScrollbackController, ElementScrollbackController);
}