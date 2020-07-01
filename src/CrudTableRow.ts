import * as controller from 'hr.controller';
import { IConfirm, BrowserConfirm } from './confirm';
import { IAlert, BrowserAlert } from './alert';
import * as crudService from './CrudService';

/**
 * This class allows extensions to be created for CrudTableRows, this is the reccomended way to add
 * customizations to your CrudTableRows as you don't have to worry about injecting and calling a
 * superclass constructor.
 */
export class CrudTableRowControllerExtensions {

    /**
     * This function is called during the row's constructor.
     * @param row The row being constructed.
     * @param bindings The bindings for the row, you can use setListener to set your extensions class as an additional listener on the row.
     * @param data The data for the row, your subclassed version can be more specific here.
     */
    public rowConstructed(row: CrudTableRowController, bindings: controller.BindingCollection, data: any): void {

    }

    /**
     * This is called when a row edit button is pressed. Return true to allow the default editing process to happen, false if you want to handle
     * it yourself. By default the crud service is told to edit.
     * @param row The row being edited
     * @param data The data for the row, will be the same as what was passed to rowConstructed.
     */
    public onEdit(row: CrudTableRowController, data: any): boolean {
        return true;
    }

    public onDelete(row: CrudTableRowController, data: any): Promise<boolean> {
        return Promise.resolve(true);
    }
}

/**
 * Controller for a row on the crud page, you can customize it by subclassing CrudTableRowControllerExtensions.
 */
export class CrudTableRowController {
    public static get InjectorArgs(): controller.InjectableArgs {
        return [controller.BindingCollection, IConfirm, crudService.ICrudService, IAlert, controller.InjectControllerData, CrudTableRowControllerExtensions];
    }

    protected data: any;
    protected crudService: crudService.ICrudService;
    protected confirm: IConfirm;
    protected alert: IAlert;

    constructor(bindings: controller.BindingCollection, confirm: IConfirm, crudService: crudService.ICrudService, alert: IAlert, data: any, private extensions: CrudTableRowControllerExtensions) {
        this.data = data;
        this.crudService = crudService;
        this.confirm = confirm;
        this.alert = alert;

        if (!this.crudService.canEdit(data)) {
            var editToggle = bindings.getToggle("edit");
            editToggle.off();
        }
        else {
            var viewToggle = bindings.getToggle("view");
            viewToggle.off();
        }

        if (!this.crudService.canDel(data)) {
            var deleteToggle = bindings.getToggle("del");
            deleteToggle.off();
        }

        this.extensions.rowConstructed(this, bindings, data);
    }

    public edit(evt: Event) {
        evt.preventDefault();
        if(this.extensions.onEdit(this, this.data)) {
            this.crudService.edit(this.data);
        }
    }

    public view(evt: Event) {
        evt.preventDefault();
        if (this.extensions.onEdit(this, this.data)) {
            this.crudService.edit(this.data);
        }
    }

    public async del(evt: Event) {
        evt.preventDefault();
        if(await this.extensions.onDelete(this, this.data)) {
            if (await this.confirm.confirm(this.crudService.getDeletePrompt(this.data))) {
                try {
                    await this.crudService.del(this.data);
                }
                catch (err) {
                    var message = "An error occured deleting data.";
                    if (err.message) {
                        message += " Message: " + err.message;
                    }
                    console.log(message);
                    this.alert.alert(message);
                }
            }
        }
    }
}

export function addServices(services: controller.ServiceCollection) {
    services.tryAddTransient(CrudTableRowControllerExtensions, s => new CrudTableRowControllerExtensions());
    services.tryAddTransient(CrudTableRowController, CrudTableRowController);
    services.tryAddShared(IConfirm, s => new BrowserConfirm());
    services.tryAddShared(IAlert, s => new BrowserAlert());
}