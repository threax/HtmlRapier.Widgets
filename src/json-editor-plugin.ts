"use strict";

import { JSONEditor, JSONEditorOptions } from 'jdorn.json-editor';
import * as models from 'hr.models'
import * as schema from 'hr.widgets.SchemaConverter';
import * as controller from 'hr.controller';
import * as typeId from 'hr.typeidentifiers';

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
     * Call the editor's onChange function.
     */
    onChange();

    /**
     * Replace the schema on the model
     */
    replaceSchema(schema);
}

/**
 * This class actually implements the interface that talks to the JSON Editor.
 */
class ConcreteJsonEditorModel<T> implements JsonEditorModel<T> {
    private editor;
    private element: HTMLElement;
    private options: JsonEditorModelOptions<T>;

    constructor(element: HTMLElement, options: JsonEditorModelOptions<T>){
        this.editor = new JSONEditor(element, options);
        this.element = element;
        this.options = options;
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

    getSrc() {
        return null;
    }

    onChange() {
        this.editor.onChange();
    }

    replaceSchema(schema) {
        this.editor.destroy();
        this.options.schema = schema;
        this.editor = new JSONEditor(this.element, this.options);
    }

    public setPrototype(proto: T): void {
        //This is considered handled by the schema including hidden
        //properties for anything that is not edited.
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

    onChange() {
        this.childModel.onChange();
    }

    replaceSchema(schema) {
        this.childModel.replaceSchema(schema);
    }

    public setPrototype(proto: T): void {
        //Done nothing since this uses classes
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
    var model:JsonEditorModel<T> = new ConcreteJsonEditorModel<T>(element, options)
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
                    if (prop["x-ui-type"] === "password") {
                        prop.type = "string";
                        prop.format = "password"
                    }
                    else if (prop["x-ui-type"] === "hidden") {
                        prop.options = prop.options || {};
                        prop.options.hidden = true;
                    }
                    else {
                        prop.type = prop["x-ui-type"];
                    }
                }

                if (prop["x-values"]) {
                    var source = {
                        source: prop["x-values"],
                        title: "{{item.label}}",
                        value: "{{item.value}}"
                    }
                    prop.enumSource = [source];
                }

                //Handle order
                if (prop["x-ui-order"] !== undefined) {
                    prop.propertyOrder = prop["x-ui-order"];
                }

                //Remove null options for types, not really using the ui that way
                if (prop.type && typeId.isArray(prop.type)) {
                    var type: string[] = prop.type;
                    //Don't really care, take the first type that is not "null"
                    for (let i = 0; i < type.length; ++i) {
                        var t = type[i];
                        if (t.toLowerCase() !== "null") {
                            prop.type = t; //Set the type to just our discovered type
                            break;
                        }
                    }
                }

                //remove min length
                delete prop.minLength;
            }
        }

        return schema;
    }
}

/**
 * Setup the services to use the json editor schema converter.
 */
export function AddServices(services: controller.ServiceCollection) {
    services.tryAddTransient(schema.ISchemaConverter, JsonEditorSchemaConverter);
}