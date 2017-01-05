import * as toggles from 'hr.toggles';

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

    public showMain() {
        this.toggleGroup.activate(this.mainToggle);
    }

    public showLoad() {
        this.toggleGroup.activate(this.loadToggle);
    }

    public showError(error: Error) {
        this.toggleGroup.activate(this.errorToggle);
    }
}