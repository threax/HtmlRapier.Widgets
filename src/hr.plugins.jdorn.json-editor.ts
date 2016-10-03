"use strict";

import { JSONEditor } from 'jdorn.json-editor';

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
 * A model interface for the json editor.
 * @param {JSONEditor} editor - The editor to wrap.
 */
export function Model(editor) {
    this.setData = function (data) {
        editor.root.setValue(data, true);
    }

    this.appendData = this.setData;

    function clear() {
        editor.root.setValue(null, true);
    }
    this.clear = clear;

    this.getData = function () {
        return editor.getValue();
    }

    this.getSrc = function () {
        return null;
    }

    this.getEditor = function () {
        return editor;
    }
}

export function create(element: HTMLElement, options?:any): void {
    return new Model(new JSONEditor(element, options));
}