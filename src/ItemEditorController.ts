﻿import * as controller from 'hr.controller';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as jsonEditor from 'hr.widgets.json-editor-plugin';
import { ValidationError } from 'hr.error';
import * as toggles from 'hr.toggles';

export type ItemUpdatedCallback<T> = (data: T) => Promise<any>;

/**
 * Settings for the ItemEditor, optionally takes a schema if you know it ahead of time.
 * Otherwise use setSchema on the controller manually, note you will need to subclass this controller
 * to access that function.
 * @param {any} schema?
 */
export class ItemEditorSettings<T> {
    constructor(schema?: any) {
        this.schema = schema;
    }

    schema: any;
    editorHolderHandle: string = "editorHolder";
    toggleName: string = "dialog";
    mainToggleName: string = "main";
    errorToggleName: string = "error";
    loadToggleName: string = "load";
    setLoadingOnStart: boolean = true;
}

interface DataToEdit {
    data: any,
    updated: ItemUpdatedCallback<any>
}

var defaultError = { path: null };

export class ItemEditorController<T> {
    private formModel: jsonEditor.JsonEditorModel<T> = null;
    private currentError: Error = null;
    private toggle;
    private updated: ItemUpdatedCallback<T>;
    private lifecycle: MainLoadErrorLifecycle;
    private editorHandle;
    private dataToEdit: DataToEdit = undefined; //Sometimes the data is set to edit before the schema is loaded, in that case it will be stored here temporarily

    constructor(bindings: controller.BindingCollection, settings: ItemEditorSettings<T>) {
        this.editorHandle = bindings.getHandle(settings.editorHolderHandle);
        if (settings.schema !== undefined) {
            this.setSchema(settings.schema);
        }
        this.toggle = bindings.getToggle(settings.toggleName);
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(settings.mainToggleName),
            bindings.getToggle(settings.loadToggleName),
            bindings.getToggle(settings.errorToggleName),
            settings.setLoadingOnStart);
    }

    public setSchema(schema) {
        if (this.formModel) {
            this.formModel.replaceSchema(schema);
        }
        else {
            this.formModel = jsonEditor.create<T>(this.editorHandle, {
                schema: schema,
                disable_edit_json: true,
                disable_properties: true,
                disable_collapse: true,
                show_errors: "always",
                custom_validators: [
                    (schema, value, path) => this.showCurrentErrorValidator(schema, value, path)
                ],
            });
            if (this.dataToEdit !== undefined) {
                this.editData(this.dataToEdit.data, this.dataToEdit.updated);
                this.dataToEdit = undefined;
            }
        }
    }

    public editData(data: T, updated: ItemUpdatedCallback<T>) {
        this.currentError = null;
        if (this.formModel) {
            this.formModel.setData(data);
            this.toggle.on();
            this.lifecycle.showMain();
            this.updated = updated;
        }
        else {
            this.dataToEdit = {
                data: data, //No form yet, store data until we get one
                updated: updated
            };
        }
    }

    public submit(evt) {
        evt.preventDefault();
        this.lifecycle.showLoad();
        var data = this.currentData;
        this.updated(data)
            .then(r => {
                this.toggle.off();
            })
            .catch(err => {
                this.currentError = err;
                this.formModel.onChange();
                this.lifecycle.showMain();
            });
    }

    public get currentData(): T {
        if (this.formModel) {
            return this.formModel.getData();
        }
        return null;
    }

    public cancel(evt) {
        evt.preventDefault();
        this.toggle.off();
    }

    protected show() {
        this.toggle.on();
    }

    protected activateMain() {
        this.lifecycle.showMain();
    }

    protected activateLoad() {
        this.lifecycle.showLoad();
    }

    protected activateError(error: Error) {
        this.lifecycle.showError(error);
    }

    /**
     * Activate a toggle defined in a subclass, it will go through the main lifecyle and deactivate those toggles and then activate the one you pass in.
     * @param toggle
     */
    protected activateOtherToggle(toggle: toggles.Toggle) {
        this.lifecycle.showOther(toggle);
    }

    private showCurrentErrorValidator(schema, value, path): any {
        if (this.currentError !== null) {
            if (path === "root") {
                return {
                    path: path,
                    message: this.currentError.message
                }
            }

            if (this.isValidationError(this.currentError)) {
                //walk path to error
                var shortPath = this.errorPath(path);
                var errorMessage = this.currentError.getValidationError(shortPath);
                if (errorMessage !== undefined) {
                    return {
                        path: path,
                        message: errorMessage
                    };
                }
            }
        }
        return defaultError;
    }

    private isValidationError(test: Error): test is ValidationError {
        return (<ValidationError>test).getValidationError !== undefined;
    }

    private errorPath(path) {
        return path.replace('root.', '');
    }
}

/**
 * Setup the services to use the json editor schema converter.
 */
export function AddServices(services: controller.ServiceCollection) {
    jsonEditor.AddServices(services);
}