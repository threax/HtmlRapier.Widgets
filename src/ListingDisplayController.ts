import * as controller from 'hr.controller';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as view from 'hr.view';

export class ListingDisplayOptions {
    listingModelName: string = "listing";
    mainToggleName: string = "main";
    errorToggleName: string = "error";
    loadToggleName: string = "load";
    setLoadingOnStart: boolean = true;
}

export type ListingItemCreatedCallback<T> = (bindings: controller.BindingCollection, data: T) => void;

export class ListingDisplayController<T> {
    private listingModel: controller.IView<any>;
    private lifecycle: MainLoadErrorLifecycle;

    constructor(bindings: controller.BindingCollection, settings: ListingDisplayOptions) {
        this.listingModel = bindings.getView<T>(settings.listingModelName);
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

    public appendData(data: T | T[], createdCallback?: ListingItemCreatedCallback<T>) {
        this.listingModel.appendData(data, createdCallback);
    }

    public showMain() {
        this.lifecycle.showMain();
    }

    public showLoad() {
        this.lifecycle.showLoad();
    }

    public showError(error: Error) {
        this.lifecycle.showError(error);
    }
}