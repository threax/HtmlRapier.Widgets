import * as toggles from 'hr.toggles';

export class LifecycleSettings {
    private loadToggle = "load";
    private mainToggle = "main";
    private errorToggle = "error";

    /**
     * The name of the load toggle. Defaults to "load".
     * @returns
     */
    get LoadToggle() {
        return this.loadToggle;
    }
    set LoadToggle(value) {
        this.loadToggle = value;
    }

    /**
     * The name of the main toggle. Defaults to "main".
     * @returns
     */
    get MainToggle() {
        return this.mainToggle;
    }
    set MainToggle(value) {
        this.mainToggle = value;
    }

    /**
     * The name of the error toggle, defaults to "error".
     * @returns
     */
    get ErrorToggle() {
        return this.errorToggle;
    }
    set ErrorToggle(value) {
        this.errorToggle = value;
    }
};

/**
 * This class makes managing a load lifecycle a bit easier. It will gather a load, main, error
 * set of toggles up into a group that you can manipulate.
 * @param bindings The controller bindings to get toggles from.
 * @param {LoadLifecycleSettings} settings? Optional settings.
 */
export class Lifecycle {
    private load;
    private main;
    private error;
    private group;

    constructor(bindings, settings?: LifecycleSettings) {
        if (settings === undefined) {
            settings = new LifecycleSettings();
        }

        this.load = bindings.getToggle(settings.LoadToggle);
        this.main = bindings.getToggle(settings.MainToggle);
        this.error = bindings.getToggle(settings.ErrorToggle);
        this.group = new toggles.Group(this.load, this.main, this.error);
    }

    /**
     * Show the loading toggle.
     */
    showLoading() {
        this.group.activate(this.load);
    }

    /**
     * Show the main toggle.
     */
    showMain() {
        this.group.activate(this.main);
    }

    /**
     * Show the error toggle.
     */
    showError() {
        this.group.activate(this.error);
    }
}