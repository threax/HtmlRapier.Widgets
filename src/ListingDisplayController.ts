import * as controller from 'hr.controller';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as view from 'hr.view';
import * as components from 'hr.components';
import { ScrollbackController } from 'hr.widgets.ScrollbackController';

export class ListingDisplayOptions {
    listingModelName: string = "listing";
    mainToggleName: string = "main";
    errorToggleName: string = "error";
    loadToggleName: string = "load";
    setLoadingOnStart: boolean = true;
}

/**
 * This superclass is pointless, should get rid of it
 */
export class ListingDisplayController<T> {
    private listingModel: controller.IView<any>;
    private lifecycle: MainLoadErrorLifecycle;
    private scrollback: ScrollbackController;

    constructor(bindings: controller.BindingCollection, settings: ListingDisplayOptions, scrollback: ScrollbackController) {
        this.listingModel = bindings.getView<T>(settings.listingModelName);
        this.scrollback = scrollback;
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(settings.mainToggleName),
            bindings.getToggle(settings.loadToggleName),
            bindings.getToggle(settings.errorToggleName),
            settings.setLoadingOnStart);
    }

    public clearData() {
        this.listingModel.clear();
    }

    public setFormatter(formatter: view.IViewDataFormatter<T>): void {
        this.listingModel.setFormatter(formatter);
    }

    public appendData(data: T | T[], createdCallback?: components.CreatedCallback<T>, variantFinderCallback?: components.VariantFinderCallback<T>) {
        this.listingModel.appendData(data, createdCallback, variantFinderCallback);
    }

    public showMain() {
        this.scrollback.scrollToPosition();
        this.lifecycle.showMain();
    }

    public showLoad() {
        this.lifecycle.showLoad();
    }

    public showError(error: Error) {
        this.lifecycle.showError(error);
    }
}