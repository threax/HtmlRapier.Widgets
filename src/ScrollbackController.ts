import * as controller from 'hr.controller';
import * as form from 'hr.form';
import { ICrudService, ItemEditorClosedCallback, ItemUpdatedCallback, ShowItemEditorEventArgs } from 'hr.widgets.CrudService';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as error from 'hr.error';

export class ScrollbackController {
    scrollToPosition(): void {

    }
}

export class WindowTopScrollbackController extends ScrollbackController {
    scrollToPosition(): void {
        window.scrollTo(0, 0);
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddShared(ScrollbackController, s => new WindowTopScrollbackController());
}