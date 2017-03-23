"use strict";

import { JSONEditor, JSONEditorOptions } from 'jdorn.json-editor';
import * as models from 'hr.models'
import * as schema from 'hr.widgets.SchemaConverter';
import * as controller from 'hr.controller';

JSONEditor.defaults.theme = 'bootstrap3custom';
JSONEditor.defaults.iconlib = 'bootstrap3';
JSONEditor.defaults.disable_collapse = true;
JSONEditor.defaults.disable_edit_json = true;
JSONEditor.defaults.disable_properties = true;

//Override Boolean editors, we want checkboxes by default for booleans
JSONEditor.defaults.resolvers.unshift(function (schema) {
    if (schema.type === 'boolean') {
        // If explicitly set to 'select', use that
        if (schema.format === "select" || (schema.options && schema.options.select)) {
            return "select";
        }
        // Otherwise, default to select menu
        return 'checkbox';
    }
});

/**
 * A custom model for json editor instances. Gives access to the wrapped editor.
 */
export interface JsonEditorModel<T> extends models.Model<T>{
    /**
     * The editor that this model wraps.
     */
    getEditor();
}

/**
 * This class actually implements the interface that talks to the JSON Editor.
 */
class ConcreteJsonEditorModel<T> implements JsonEditorModel<T> {
    private editor;

    constructor(editor){
        this.editor = editor;
    }

    setData(data:T) {
        this.editor.root.setValue(data, true);
    }

    appendData = this.setData;

    clear() {
        this.editor.root.setValue(null, true);
    }

    getData():T {
        return this.editor.getValue();
    }

    getEditor() {
        return this.editor;
    }

    getSrc(){
        return null;
    }
}

/**
 * This is a typed model for the json editor. It will use the strongConstructor passed in
 * to convert to a strong type.
 */
class JsonEditorTypedModel<T> extends models.StrongTypedModel<T> implements JsonEditorModel<T>
{
    constructor(childModel: JsonEditorModel<T>, strongConstructor: models.StrongTypeConstructor<T>) {
        super(childModel, strongConstructor);
    }

    getEditor() {
        return this.childModel.getEditor();
    }
}

/**
 * The options for the Json Editor Model. Also provides the options for the Json Editor the model will wrap.
 */
export interface JsonEditorModelOptions<T> extends JSONEditorOptions{
    strongConstructor?: models.StrongTypeConstructor<T>;
}

/**
 * Helper function to create the right model depending on your settings.
 */
export function create<T>(element: HTMLElement, options?:JsonEditorModelOptions<T>): JsonEditorModel<T> {
    var model:JsonEditorModel<T> = new ConcreteJsonEditorModel<T>(new JSONEditor(element, options))
    if(options !== undefined && options.strongConstructor !== undefined){
        model = new JsonEditorTypedModel<T>(model, options.strongConstructor);
    }
    return model;
}

class JsonEditorSchemaConverter extends schema.ISchemaConverter {
    public static get InjectorArgs(): controller.DiFunction<any>[] {
        return [];
    }

    public convert(schema): any {
        var schema = JSON.parse(JSON.stringify(schema));

        if (schema["x-ui-title"]) {
            schema.title = schema["x-ui-title"];
        }

        var properties = schema.properties;
        if (properties) {
            for (var key in properties) {
                var prop = properties[key];
                //Convert ui type first
                if (prop["x-ui-type"]) {
                    prop.type = prop["x-ui-type"];
                }

                if (prop["x-values"]) {
                    var source = {
                        source: prop["x-values"],
                        title: "{{item.label}}",
                        value: "{{item.value}}"
                    }
                    prop.enumSource = [source];
                }
            }
        }

        return schema;
    }
}

/**
 * Setup the services to use the json editor schema converter.
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddScoped(schema.ISchemaConverter, JsonEditorSchemaConverter);
}