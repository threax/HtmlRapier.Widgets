import * as controller from 'hr.controller';
import * as form from 'hr.form';
import { ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs } from 'hr.widgets.CrudService';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as error from 'hr.error';

/// Taken from user eyelidlessness at
/// https://stackoverflow.com/questions/1480133/how-can-i-get-an-objects-absolute-position-on-the-page-in-javascript
export function cumulativeOffset(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);

    return {
        top: top,
        left: left
    };
};

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
            console.log("Scrolling to origin");
            window.scrollTo(0, 0);
        }
        else {
            this.once = true;
        }
    }
}

export class IdScrollbackController extends ScrollbackController {
    private onceLoading: boolean = false; //Only scrollback after the first call to this controller
    private onceMainShown: boolean = false; //Only scrollback after the first call to this controller

    constructor(private id: string) {
        super();
    }

    onLoading(): void {
        if (this.onceLoading) {
            var elem = window.document.getElementById(this.id);
            elem.scrollIntoView(true);
        }
        else {
            this.onceLoading = true;
        }
    }

    onMainShown(): void {
        if (this.onceMainShown) {
            var elem = window.document.getElementById(this.id);
            elem.scrollIntoView(true);
        }
        else {
            this.onceMainShown = true;
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ScrollbackController, s => new WindowTopScrollbackController());
}