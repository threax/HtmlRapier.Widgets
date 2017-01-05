import * as controller from 'hr.controller';
import { MainLoadErrorLifecycle } from 'hr.widgets.MainLoadErrorLifecycle';
import * as jsonEditor from 'hr.widgets.json-editor-plugin';
import {ValidationError} from 'hr.error';

export type ItemUpdatedCallback<T> = (data: T) => Promise<any>;

export class ItemEditorSettings<T> {
    constructor(schema: any) {
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

var defaultError = { path: null };

export class ItemEditorController<T> {
    public static Builder<T>(settings: ItemEditorSettings<T>) {
        return new controller.ControllerBuilder<ItemEditorController<T>, ItemEditorSettings<T>, void>(ItemEditorController, settings);
    }

    private formModel = null;
    private jsonEditor;
    private currentError: Error = null;
    private toggle;
    private updated: ItemUpdatedCallback<T>;
    private lifecycle: MainLoadErrorLifecycle;

    constructor(bindings: controller.BindingCollection, settings: ItemEditorSettings<T>) {
        this.formModel = jsonEditor.create<any>(bindings.getHandle(settings.editorHolderHandle), {
            schema: settings.schema,
            disable_edit_json: true,
            disable_properties: true,
            disable_collapse: true,
            show_errors: "always",
            custom_validators: [
                (schema, value, path) => this.showCurrentErrorValidator(schema, value, path)
            ],
        });
        this.jsonEditor = this.formModel.getEditor();
        this.toggle = bindings.getToggle(settings.toggleName);
        this.lifecycle = new MainLoadErrorLifecycle(
            bindings.getToggle(settings.mainToggleName),
            bindings.getToggle(settings.errorToggleName),
            bindings.getToggle(settings.loadToggleName),
            settings.setLoadingOnStart);
    }

    public editData(data: T, updated: ItemUpdatedCallback<T>) {
        this.currentError = null;
        this.formModel.setData(data);
        this.toggle.on();
        this.lifecycle.showMain();
        this.updated = updated;
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