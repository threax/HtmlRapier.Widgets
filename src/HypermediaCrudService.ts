import * as crudPage from './CrudPage';
import * as pageWidget from './PageNumberWidget';
import * as di from 'htmlrapier/src/di';
export { CrudSearch, CrudPageNumbers, CrudTableController, CrudItemEditorController, CrudItemEditorType, CrudSort, CrudPageView } from './CrudPage';
import * as ep from 'htmlrapier/src/externalpromise';
import * as deeplink from 'htmlrapier/src/deeplink';
import { ExternalPromise } from 'htmlrapier/src/externalpromise';

export interface HypermediaPageInjectorOptions {
    /**
     * Determine if the query of the current page should be used as the first load's
     * query or not. Defaults to true. If you only have a single table and want deep linking
     * keep this to true, if the crud table you are creating is part of a larger page, you 
     * probably want to set this to false.
     */
    usePageQueryForFirstLoad?: boolean;

    /**
     * A unique name for the injector. If this is not provided it will be auto generated to 'htmlrapier/src/autonamed_hypermedia_injector_X'
     * where X is the index of how many injectors have been created so far. This is usually good enough and you won't need to provide
     * a value for this option.
     */
    uniqueName?: string;
}

export abstract class HypermediaPageInjector {
    private static nameindex = 0;
    private _usePageQueryForFirstLoad: boolean = true;
    private _uniqueName: string;

    constructor(options?: HypermediaPageInjectorOptions) {
        if (options === undefined) {
            options = {};
        }
        if (options.usePageQueryForFirstLoad !== undefined) {
            this._usePageQueryForFirstLoad = options.usePageQueryForFirstLoad;
        }
        this._uniqueName = options.uniqueName;
        if (this.uniqueName === undefined) {
            this._uniqueName = "hr.autonamed_hypermedia_injector_" + HypermediaPageInjector.nameindex++;
        }
    }

    /**
     * List the data according to the query.
     * @param query
     */
    public abstract list(query: any): Promise<HypermediaCrudCollection>;

    /**
     * Returns true if the injector can list the data.
     */
    public abstract canList(): Promise<boolean>;

    /**
     * Get text for the delete prompt for an item.
     * @param item
     */
    public abstract getDeletePrompt(item: HypermediaCrudDataResult): string;

    /**
     * Get the item id for a particular item. This can return null if there is no appropriate id.
     * @param item
     */
    public getItemId(item: HypermediaCrudDataResult): string | null {
        return null;
    }

    /**
     * Create a query that looks up an item by its id. The id that needs to be stored
     * will be passed in as a string, since that can represent any id type.
     */
    public createIdQuery(id: string): {} | null {
        return null;
    }

    /**
     * Get the item id for a particular item. This can return null if there is no appropriate id.
     * By default this function will use createIdQuery to create a query for the id and then the
     * list function to get the result. If you need to do something else you can override this function.
     * If createIdQuery returns null this function will also return null.
     * @param item
     */
    public async getById(id: string): Promise<HypermediaCrudDataResult | null> {
        var query = this.createIdQuery(id);
        var retVal = null;
        if (query !== null) {
            var results = await this.list(query);
            if (results.data.total > 0) {
                retVal = results.items[0];
            }
        }
        return retVal;
    }

    /**
     * Determine if the query of the current page should be used as the first load's
     * query or not. Defaults to true. If you only have a single table and want deep linking
     * keep this to true, if the crud table you are creating is part of a larger page, you 
     * probably want to set this to false.
     */
    public get usePageQueryForFirstLoad(): boolean {
        return this._usePageQueryForFirstLoad;
    }

    /**
     * Get a default object to use when adding a new item. By default this returns an
     * empty object, but you can override it to return what you need.
     */
    public async getDefaultAddObject(): Promise<any> {
        return Promise.resolve({});
    }

    public get uniqueName(): string {
        return this._uniqueName;
    }

    /**
     * Get a search schema, this can return null to let the table load the search schema automatically
     * from the listing schema. Otherwise return the desired schema here. Using this can make your search
     * appear more quickly if the first page of results is slow.
     */
    public async getSearchSchema() {
        return null;
    }

    /**
     * Modify the page data for a deep link query as needed. Note that the page data is not copied 
     * before this function is called. If a copy is needed to modify please create it in your implementation.
     * @param pageData The currentPage.data for the current page.
     */
    public modifyPageQueryData(pageData: any): any {
        return pageData;
    }
}

export abstract class HypermediaChildPageInjector<T extends HypermediaCrudDataResult> extends HypermediaPageInjector {
    private parentResult: T;

    constructor(options?: HypermediaPageInjectorOptions) {
        if (options === undefined) {
            options = {};
        }
        else {
            options = Object.create(options);
        }
        options.usePageQueryForFirstLoad = false;
        super(options);
    }

    public set parent(value: T) {
        this.parentResult = value;
    }

    public get parent(): T {
        return this.parentResult;
    }
}

export abstract class AbstractHypermediaPageInjector extends HypermediaPageInjector {
    constructor(options?: HypermediaPageInjectorOptions) {
        super(options);
    }

    public getDeletePrompt(item: HypermediaCrudDataResult): string {
        return "Are you sure you want to delete this item?";
    }
}

export abstract class AbstractHypermediaChildPageInjector<T extends HypermediaCrudDataResult> extends HypermediaChildPageInjector<T> {
    constructor(options?: HypermediaPageInjectorOptions) {
        super(options);
    }

    public getDeletePrompt(item: HypermediaCrudDataResult): string {
        return "Are you sure you want to delete this item?";
    }
}

export interface HypermediaCrudDataResult {
    data: any;
}

export interface HypermediaRefreshableResult extends HypermediaCrudDataResult {
    refresh();
    canRefresh();
}

export function IsHypermediaRefreshableResult(i: HypermediaCrudDataResult): i is HypermediaRefreshableResult {
    return (<HypermediaRefreshableResult>i).refresh !== undefined
        && (<HypermediaRefreshableResult>i).canRefresh !== undefined;
}

export interface HypermediaUpdatableResult extends HypermediaCrudDataResult {
    update(data: any): Promise<any>;
    canUpdate(): boolean;
}

export function IsHypermediaUpdatableResult(i: HypermediaCrudDataResult): i is HypermediaUpdatableResult {
    return (<HypermediaUpdatableResult>i).update !== undefined
        && (<HypermediaUpdatableResult>i).canUpdate !== undefined;
}

export interface HypermediaDeleteableResult extends HypermediaCrudDataResult {
    delete(): Promise<void>;
    canDelete(): boolean;
}

export function IsHypermediaDeleteableResult(i: HypermediaCrudDataResult): i is HypermediaDeleteableResult {
    return (<HypermediaDeleteableResult>i).delete !== undefined
        && (<HypermediaDeleteableResult>i).canDelete !== undefined;
}

export interface HypermediaCrudCollection {
    data: pageWidget.OffsetLimitTotal;
    items: any[];

    refresh();
    canRefresh();

    previous();
    canPrevious();

    next();
    canNext();

    first();
    canFirst();

    last();
    canLast();
}

export interface AddableCrudCollection extends HypermediaCrudCollection {
    hasAddDocs(): boolean;
    getAddDocs(): Promise<any>;

    add(data: any): Promise<any>;
    canAdd(): boolean;
}

export function IsAddableCrudCollection(i: HypermediaCrudCollection): i is AddableCrudCollection {
    return (<AddableCrudCollection>i).hasAddDocs !== undefined
        && (<AddableCrudCollection>i).getAddDocs !== undefined
        && (<AddableCrudCollection>i).add !== undefined
        && (<AddableCrudCollection>i).canAdd !== undefined;
}

export interface UpdateDocs extends HypermediaCrudCollection {
    hasUpdateDocs(): boolean;
    getUpdateDocs(): Promise<any>;
}

export function IsUpdateDocs(i: HypermediaCrudCollection): i is UpdateDocs {
    return (<UpdateDocs>i).hasUpdateDocs !== undefined
        && (<UpdateDocs>i).getUpdateDocs !== undefined;
}

export interface GetDocs extends HypermediaCrudCollection {
    hasGetDocs(): boolean;
    getGetDocs(): Promise<any>;
}

export function IsGetDocs(i: HypermediaCrudCollection): i is GetDocs {
    return (<GetDocs>i).hasGetDocs !== undefined
        && (<GetDocs>i).getGetDocs !== undefined;
}

export interface SearchableCrudCollection extends HypermediaCrudCollection {
    hasListDocs(): boolean;
    getListDocs(): Promise<any>;
}

export function IsSearchableCrudCollection(i: HypermediaCrudCollection): i is SearchableCrudCollection {
    return (<SearchableCrudCollection>i).hasListDocs !== undefined
        && (<SearchableCrudCollection>i).getListDocs !== undefined;
}

export interface ListingSchemaCrudCollection extends HypermediaCrudCollection {
    getGetDocs(): Promise<any>;
    hasGetDocs(): boolean;
}

export function IsListingSchemaCrudCollection(i: HypermediaCrudCollection): i is ListingSchemaCrudCollection {
    return (<ListingSchemaCrudCollection>i).getGetDocs !== undefined
        && (<ListingSchemaCrudCollection>i).hasGetDocs !== undefined;
}

export class HypermediaCrudService extends crudPage.ICrudService implements deeplink.IDeepLinkHandler {
    public static get InjectorArgs(): di.DiFunction<any>[] {
        return [HypermediaPageInjector, deeplink.IDeepLinkManager];
    }

    private initialLoad: boolean = true;
    private initialPageLoadPromise = new ep.ExternalPromise();
    private currentPage: HypermediaCrudCollection = null;
    private allowCloseHistory: boolean = true;
    private currentPageLoadPromise: Promise<HypermediaCrudCollection> = null;
    private externalPageLoadPromise: ExternalPromise<HypermediaCrudCollection> = null;

    constructor(private pageInjector: HypermediaPageInjector, private linkManager: deeplink.IDeepLinkManager) {
        super();
        if (!this.linkManager) {
            this.linkManager = new deeplink.NullDeepLinkManager();
        }
        this.linkManager.registerHandler(this.pageInjector.uniqueName, this);
    }

    public async getItemSchema() {
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;

        //Prioritize returning the update item docs
        if (IsUpdateDocs(this.currentPage)) {
            if (this.currentPage.hasUpdateDocs()) {
                var docs = await this.currentPage.getUpdateDocs();
                return docs.requestSchema;
            }
        }

        //If we can't get the update item docs, see if we can return add item docs
        var schema = await this.getAddItemSchema();
        if (schema !== undefined) {
            return schema;
        }

        //Finally return the schema to view the item with a get
        return await this.getViewSchema();
    }

    public async getViewSchema() {
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;

        //Return the schema to view the item with a get
        if (IsGetDocs(this.currentPage)) {
            if (this.currentPage.hasGetDocs()) {
                var docs = await this.currentPage.getGetDocs();
                return docs.responseSchema;
            }
        }
    }

    public async getAddItemSchema() {
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;

        //If possible return the add item docs
        if (IsAddableCrudCollection(this.currentPage)) {
            if (this.currentPage.hasAddDocs()) {
                var docs = await this.currentPage.getAddDocs();
                return docs.requestSchema;
            }
        }
    }

    public async getListingSchema() {
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;

        //Now check current page and see if we can get listings.
        if (IsListingSchemaCrudCollection(this.currentPage)) {
            if (this.currentPage.hasGetDocs()) {
                var docs = await this.currentPage.getGetDocs();
                return docs.responseSchema;
            }
        }
    }

    public async getSearchSchema() {
        //See if the injector provides a schema
        var schema = await this.pageInjector.getSearchSchema();
        if(schema != null){
            return schema;
        }

        //If not load the schema for the listing function.
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;
        if (IsSearchableCrudCollection(this.currentPage) && this.currentPage.hasListDocs()) {
            var docs = await this.currentPage.getListDocs();
            return docs.requestSchema;
        }
    }

    public async add(item?: any) {
        if (item === undefined) {
            item = await this.pageInjector.getDefaultAddObject();
        }
        this.fireAddItemEvent(new crudPage.ShowItemEditorEventArgs(item, a => this.finishAdd(a), this.currentPage));
    }

    private async finishAdd(data) {
        if (IsAddableCrudCollection(this.currentPage)) {
            await this.currentPage.add(data);
            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
            this.refreshPage();
        }
    }

    private getCurrentPageQueryData(): any {
        return this.pageInjector.modifyPageQueryData(this.currentPage.data);
    }

    private async itemEditorClosed() {
        if (this.currentPage && this.allowCloseHistory) {
            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
        }
    }

    public async canAdd() {
        return IsAddableCrudCollection(this.currentPage) && this.currentPage.canAdd();
    }

    public async edit(item: HypermediaCrudDataResult) {
        await this.beginEdit(item, true);
    }

    private async beginEdit(item: HypermediaCrudDataResult, recordHistory: boolean) {
        if (recordHistory) {
            var itemId = this.pageInjector.getItemId(item);
            if (itemId !== null) {
                this.linkManager.pushState(this.pageInjector.uniqueName, "Edit/" + itemId, null);
            }
        }

        var dataPromise = this.refreshItemData(item);
        var update: crudPage.ItemUpdatedCallback | null = null;
        if (IsHypermediaUpdatableResult(item) && item.canUpdate()) {
            update = a => this.finishEdit(a, item);
        }
        this.fireShowItemEditorEvent(new crudPage.ShowItemEditorEventArgs(dataPromise, update, item, () => this.itemEditorClosed()));
    }

    private async refreshItemData(item: any): Promise<any> {
        if (IsHypermediaRefreshableResult(item) && item.canRefresh()) {
            item = await item.refresh();
        }

        return await this.getEditObject(item);
    }

    public canEdit(item: HypermediaCrudDataResult): boolean {
        return IsHypermediaUpdatableResult(item) && item.canUpdate();
    }

    protected async getEditObject(item: HypermediaCrudDataResult) {
        return item.data;
    }

    private async finishEdit(data, item: HypermediaCrudDataResult) {
        if (IsHypermediaUpdatableResult(item)) {
            await item.update(data);
            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
            this.refreshPage();
        }
    }

    public async del(item: HypermediaCrudDataResult) {
        if (IsHypermediaDeleteableResult(item)) {
            await item.delete();
            this.fireCrudDataModifiedEvent(new crudPage.CrudDataModifiedEventArgs());
            this.refreshPage();
        }
    }

    public canDel(item: HypermediaCrudDataResult): boolean {
        return IsHypermediaDeleteableResult(item) && item.canDelete();
    }

    public getDeletePrompt(item: HypermediaCrudDataResult): string {
        return this.pageInjector.getDeletePrompt(item);
    }

    public getSearchObject(item: any) {
        return item.data;
    }

    //Load a new page, you can call this multiple times before a result is returned, this
    //function will wait until the last requested set of data is loaded to send results out
    public getPage(query: any): Promise<HypermediaCrudCollection> {
        var replacePageUrl = true;
        //No current page, use the url query instead of the one passed in
        if (this.pageInjector.usePageQueryForFirstLoad && this.initialLoad) {
            var historyState = this.linkManager.getCurrentState(query);
            if (historyState) {
                query = historyState.query;
                var itemId = this.getEditIdFromPath(historyState.inPagePath);
                if (itemId !== null) {
                    replacePageUrl = false;
                    var item = this.pageInjector.getById(itemId).then(r => {
                        if (r !== null) {
                            this.linkManager.replaceState(this.pageInjector.uniqueName, "Edit/" + itemId, null);
                            this.beginEdit(r, false);
                        }
                    });
                }
            }
        }

        //Setup the data load promise
        var loadingPromise = this.getPageAsync(query, !this.initialLoad);
        if (this.initialLoad) {
            this.initialLoad = false;
            loadingPromise = loadingPromise
                .then(r => {
                    if (replacePageUrl) {
                        this.linkManager.replaceState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                    }
                    this.initialPageLoadPromise.resolve(r);
                    return r;
                });
        }

        return this.handlePageLoad(loadingPromise, query);
    }

    //This function handles only returning the last set of requested data.
    private async handlePageLoad(loadingPromise: Promise<HypermediaCrudCollection>, query?: any): Promise<HypermediaCrudCollection> {
        this.currentPageLoadPromise = loadingPromise;

        //If the current external promise is null, we weren't loading anything, so fire off that event.
        if (this.externalPageLoadPromise === null) {
            this.externalPageLoadPromise = new ExternalPromise();
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.externalPageLoadPromise.Promise, query));
        }

        //Wait for the results from this function
        try {
            var result = await loadingPromise;

            //If the function's loadingPromise still matches the currentPageLoadPromise then resolve the external result
            if (this.currentPageLoadPromise === loadingPromise) {
                this.externalPageLoadPromise.resolve(result);
                this.externalPageLoadPromise = null;
                return result;
            }
        }
        catch (err) {
            //If the function's loadingPromise still matches the currentPageLoadPromise then reject the external result
            if (this.currentPageLoadPromise === loadingPromise) {
                this.externalPageLoadPromise.reject(err);
                this.externalPageLoadPromise = null;
                throw err;
            }
        }

        //If we get here, return the results of the external promise when it resolves
        //We can't get here with the external promise set to null since it is handled
        //above in those situations.
        return await this.externalPageLoadPromise.Promise;
    }

    private async getPageAsync(query: any, recordHistory: boolean) {
        if (await this.pageInjector.canList()) {
            this.currentPage = await this.pageInjector.list(query);
            if (recordHistory) {
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
            }
            return this.currentPage;
        }
        else {
            throw new Error("No permissions to list, cannot get page.");
        }
    }

    public firstPage() {
        this.handlePageLoad(this.firstPageAsync());
    }

    private async firstPageAsync(): Promise<HypermediaCrudCollection> {
        if (this.currentPage) {
            if (this.currentPage.canFirst()) {
                this.currentPage = await this.currentPage.first();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the first page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the first page until a page has been loaded.");
        }
    }

    public lastPage() {
        this.handlePageLoad(this.lastPageAsync());
    }

    private async lastPageAsync(): Promise<HypermediaCrudCollection> {
        if (this.currentPage) {
            if (this.currentPage.canLast()) {
                this.currentPage = await this.currentPage.last();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the last page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the last page until a page has been loaded.");
        }
    }

    public nextPage() {
        this.handlePageLoad(this.nextPageAsync());
    }

    private async nextPageAsync(): Promise<HypermediaCrudCollection> {
        if (this.currentPage) {
            if (this.currentPage.canNext()) {
                this.currentPage = await this.currentPage.next();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the next page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the next page until a page has been loaded.");
        }
    }

    public previousPage() {
        this.handlePageLoad(this.previousPageAsync());
    }

    private async previousPageAsync(): Promise<HypermediaCrudCollection> {
        if (this.currentPage) {
            if (this.currentPage.canPrevious()) {
                this.currentPage = await this.currentPage.previous();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                return this.currentPage;
            }
            else {
                throw new Error("Cannot visit the previous page, no link found.");
            }
        }
        else {
            throw new Error("Cannot visit the previous page until a page has been loaded.");
        }
    }

    public refreshPage() {
        this.handlePageLoad(this.refreshPageAsync());
    }

    private async refreshPageAsync(): Promise<HypermediaCrudCollection> {
        if (this.currentPage) {
            if (this.currentPage.canRefresh()) {
                this.currentPage = await this.currentPage.refresh();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.getCurrentPageQueryData());
                return this.currentPage;
            }
            else {
                throw new Error("Cannot refresh the page, no link found.");
            }
        }
        else {
            throw new Error("Cannot refresh the page until a page has been loaded.");
        }
    }

    public getItems(list: HypermediaCrudCollection) {
        return list.items;
    }

    public getListingDisplayObject(item: HypermediaCrudDataResult) {
        return item.data;
    }

    public getPageNumberState(list: HypermediaCrudCollection) {
        return new pageWidget.HypermediaPageState(list);
    }

    public async onPopState(args: deeplink.DeepLinkArgs) {
        var itemId = this.getEditIdFromPath(args.inPagePath);
        if (itemId !== null) {
            var item = await this.pageInjector.getById(itemId);
            if (item !== null) {
                this.beginEdit(item, false);
            }
        }
        else {
            var loadingPromise = this.getPageAsync(args.query, false);
            this.handlePageLoad(loadingPromise, args.query);
            this.allowCloseHistory = false;
            this.fireCloseItemEditorEvent();
            this.allowCloseHistory = true;
        }
    }

    /**
     * Get the edit id of the current path, will be null if the current path is not an edit path.
     * @param inPagePath 
     */
    private getEditIdFromPath(inPagePath: string): string | null {
        if (inPagePath) {
            var split = inPagePath.split("/"); //Deep link paths will always start with a /, so add 1 to expected indices
            if (split.length >= 3 && split[1].toLowerCase() === "edit") {
                return split[2];
            }
        }
        return null;
    }
}

export function addServices(services: di.ServiceCollection) {
    services.tryAddShared(crudPage.ICrudService, s => {
        return new HypermediaCrudService(s.getRequiredService(HypermediaPageInjector), s.getService(deeplink.IDeepLinkManager));
    });
    crudPage.addServices(services);
}