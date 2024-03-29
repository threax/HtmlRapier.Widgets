﻿import * as toggles from 'htmlrapier/src/toggles';

export class MainLoadErrorLifecycle {
    private mainToggle;
    private loadToggle;
    private errorToggle;
    private toggleGroup: toggles.Group;

    constructor(mainToggle: toggles.Toggle, loadToggle: toggles.Toggle, errorToggle: toggles.Toggle, activateLoading: boolean) {
        this.mainToggle = mainToggle;
        this.loadToggle = loadToggle;
        this.errorToggle = errorToggle;
        this.toggleGroup = new toggles.Group(this.mainToggle, this.loadToggle, this.errorToggle);
        if (activateLoading) {
            this.showLoad();
        }
        else {
            this.showMain();
        }
    }

    public addOther(toggle: toggles.Toggle){
        this.toggleGroup.add(toggle);
    }

    public showMain() {
        this.toggleGroup.activate(this.mainToggle);
    }

    public showLoad() {
        this.toggleGroup.activate(this.loadToggle);
    }

    public showError(error: Error) {
        this.toggleGroup.activate(this.errorToggle);
    }

    public showOther(toggle: toggles.Toggle) {
        this.toggleGroup.activate(toggle);
    }
}