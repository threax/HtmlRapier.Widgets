"use strict";

import * as http from 'hr.http';
import { EventHandler } from 'hr.eventhandler';

export function PagedData(src, resultsPerPage) {
    var updating = new EventHandler();
    this.updating = updating.modifier;

    var updated = new EventHandler();
    this.updated = updated.modifier;

    var error = new EventHandler();
    this.error = error.modifier;

    this.resultsPerPage = resultsPerPage;
    this.currentPage = 0;

    function updateData() {
        updating.fire();
        var url = src + '?page=' + this.currentPage + '&count=' + this.resultsPerPage;
        http.get(url)
            .then(function (data) {
                updated.fire(data);
            })
            .catch(function (data) {
                error.fire(data);
            });
    }
    this.updateData = updateData;
}

/**
 * This class calls a callback function to get data.
 */
export class PagedClientData<T> {
    private listFunc;
    private updatingEvent = new EventHandler();
    private updatedEvent = new EventHandler();
    private errorEvent = new EventHandler();
    resultsPerPage;
    currentPage = 0;

    constructor(listFunc: (page: number, resultsPerPage: number) => Promise<T>, resultsPerPage) {
        this.listFunc = listFunc;
        this.resultsPerPage = resultsPerPage;
        this.resultsPerPage = resultsPerPage;
    }

    updateData() {
        this.updatingEvent.fire();
        this.listFunc(this.currentPage, this.resultsPerPage)
            .then((data) => {
                this.updatedEvent.fire(data);
            })
            .catch((data) => {
                this.errorEvent.fire(data);
            });
    }

    get updating() {
        return this.updatingEvent.modifier;
    }

    get updated() {
        return this.updatedEvent.modifier;
    }

    get error() {
        return this.errorEvent.modifier;
    }
}