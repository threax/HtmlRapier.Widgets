"use strict";

import * as toggles from 'hr.toggles';
import * as jsonEditor from 'hr.widgets.json-editor-plugin';
import { ExternalPromise } from 'hr.externalpromise';
import * as bc from 'hr.bindingcollection';
import {Model, StrongTypeConstructor} from 'hr.models';
import {ControllerBuilder} from 'hr.controller';

/**
 * Options for the Json Editor.
 */
export interface JsonObjectEditorOptions<T>{
    /**
     * A Json Schema that describes what to edit.
     */
    schema:any;

    /**
     * A constructor to create a strongly typed version of the object
     * edited by this editor. If the editor is for an any type you
     * won't need this, otherwise provide it so the objects coming out
     * of the editor always have the expected type.
     */
    strongConstructor?:StrongTypeConstructor<T>;
}

var defaultError = { path: null };
/**
 * This is a generic object editor that uses json-editor to edit objects.
 * The ui is determined by the html. This supports a load, main, error
 * lifecycle, but it is controlled externally. It can also be put on a 
 * dialog named 'dialog', which it will activate when required. It also 
 * consideres closing this dialog to be a cancellation and will send its
 * promise with an undefined result, which means cancel the operation.
 */
export class JsonObjectEditor<T> {
    static GetCreator<T>(context: JsonObjectEditorOptions<T>){
        return new ControllerBuilder<JsonObjectEditor<T>, JsonObjectEditorOptions<T>, T>(JsonObjectEditor, context);
    }

    private currentError = null;
    private titleModel: Model<T>;
    private errorModel: Model<any>;
    private formModel: jsonEditor.JsonEditorModel<T>;
    private modeModel: Model<string>;
    private formEditor;
    private fieldWatcher:FieldWatcher;
    private dialog;
    private load;
    private main;
    private error;
    private formToggles;
    private currentPromise: ExternalPromise<T> = null;

    constructor(bindings: bc.BindingCollection, context: JsonObjectEditorOptions<T>){
        this.modeModel = bindings.getModel<string>('mode');
        this.titleModel = bindings.getModel<T>('title');
        this.errorModel = bindings.getModel('error');
        this.formModel = jsonEditor.create<T>(bindings.getHandle("editorHolder"), {
            schema: context.schema,
            disable_edit_json: true,
            disable_properties: true,
            disable_collapse: true,
            show_errors: "always",
            custom_validators: [
                (schema, value, path) => this.showCurrentErrorValidator(schema, value, path)
            ],
            strongConstructor: context.strongConstructor
        });

        this.formEditor = this.formModel.getEditor();
        this.fieldWatcher = new FieldWatcher(this.formEditor);

        this.dialog = bindings.getToggle('dialog');
        this.dialog.offEvent.add(this, this.closed);

        this.load = bindings.getToggle('load');
        this.main = bindings.getToggle('main');
        this.error = bindings.getToggle('error');
        this.formToggles = new toggles.Group(this.load, this.main, this.error);
        this.formToggles.activate(this.main);
    }

    edit(data:T) : Promise<T> {
        this.currentPromise = new ExternalPromise<T>();
        this.titleModel.setData(data);
        this.modeModel.setData("Edit");
        this.formModel.setData(data);
        return this.currentPromise.Promise;
    }

    getData():T {
        return this.formModel.getData();
    }

    submit(evt) {
        evt.preventDefault();
        if (this.currentPromise !== null) {
            var data = this.getData();
            var prom = this.currentPromise;
            this.currentPromise = null;
            prom.resolve(data);
        }
    }

    closed() {
        if (this.currentPromise !== null) {
            var prom = this.currentPromise;
            this.currentPromise = null;
            prom.resolve();
        }
    }

    showMain() {
        this.formToggles.activate(this.main);
    }

    showLoad() {
        this.formToggles.activate(this.load);
    }

    showError(err) {
        var errorMessage = "No error message";
        if (err.message !== undefined) {
            errorMessage = err.message;
        }
        this.errorModel.setData(errorMessage);
        this.formToggles.activate(this.error);
        this.currentError = err;
        this.formEditor.onChange();
        this.main.on();
    }

    clearError() {
        this.fieldWatcher.clear();
        this.currentError = null;
        this.formEditor.onChange();
        this.formToggles.activate(this.main);
        this.errorModel.clear();
    }

    show() {
        this.dialog.on();
    }

    close() {
        this.dialog.off();
    }

    private showCurrentErrorValidator(schema, value, path):any {
        if (this.currentError !== null) {
            if (path === "root") {
                return {
                    path: path,
                    message: this.currentError.message
                }
            }

            if (this.currentError['errors'] !== undefined) {
                //walk path to error
                var shortPath = this.errorPath(path);
                var errorObject = this.currentError.errors[shortPath];
                if (errorObject !== undefined) {
                    //Listen for changes on field
                    this.fieldWatcher.watch(path, shortPath, this.currentError);
                    return {
                        path: path,
                        message: errorObject
                    };
                }
            }
        }
        return defaultError;
    }

    private errorPath(path) {
        return path.replace('root.', '');
    }
}

class FieldWatcher {
    private formEditor;
    private watchers = {};

    constructor(formEditor){
        this.formEditor = formEditor;
    }

    watch(path, errorObjectPath, currentError) {
        if (this.watchers[path] !== undefined) {
            this.watchers[path].clear();
        }

        this.watchers[path] = new Watcher(this.formEditor, path, errorObjectPath, currentError);
    }

    clear() {
        for (var key in this.watchers) {
            this.watchers[key].clear();
            delete this.watchers[key];
        }
    }
}

class Watcher{
    private formEditor;
    private path;
    private errorObjectPath;
    private currentError; 

    constructor(formEditor, path, errorObjectPath, currentError) {
        this.formEditor = formEditor;
        this.path = path;
        this.errorObjectPath = errorObjectPath;
        this.currentError = currentError;

        formEditor.watch(path, () => this.handler());
    }

    handler() {
        if (this.currentError.errors.hasOwnProperty(this.errorObjectPath)) {
            delete this.currentError.errors[this.errorObjectPath];
        }
        //Not a huge fan of this, but needed to be able to unwatch during a watch callback
        window.setTimeout(() => this.clear(), 1);
    };

    clear() {
        this.formEditor.unwatch(this.path, this.handler);
    }
}