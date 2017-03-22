import * as controller from 'hr.controller';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as jsonEditor from 'hr.widgets.json-editor-plugin';
import { ValidationError } from 'hr.error';

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
    public static Builder<T>(settings: ItemEditorSettings<T>) {
        return new controller.ControllerBuilder<ItemEditorController<T>, ItemEditorSettings<T>, void>(ItemEditorController, settings);
    }

    private formModel: jsonEditor.JsonEditorModel<T> = null;
    private jsonEditor;
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

    protected setSchema(schema) {
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
        this.jsonEditor = this.formModel.getEditor();
        if (this.dataToEdit !== undefined) {
            this.editData(this.dataToEdit.data, this.dataToEdit.updated);
            this.dataToEdit = undefined;
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
        var data = this.formModel.getData();
        this.updated(data)
            .then(r => {
                this.toggle.off();
            })
            .catch(err => {
                this.currentError = err;
                this.jsonEditor.onChange();
                this.lifecycle.showMain();
            });
    }

    public cancel(evt) {
        evt.preventDefault();
        this.toggle.off();
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

    private isValidationError(test: Error): test is ValidationError{
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