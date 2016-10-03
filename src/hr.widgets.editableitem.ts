"use strict";

import * as controller from 'hr.controller';
import * as typeId from 'hr.typeidentifiers';

export function EditDeleteItemController(bindings, context, data) {
    var self = this;

    for (var key in context) {
        if (typeId.isFunction(context[key])) {
            self[key] = (function (evtName) {
                return function (evt) {
                    evt.preventDefault();
                    context[evtName](data);
                }
            })(key);
        }
    }
}