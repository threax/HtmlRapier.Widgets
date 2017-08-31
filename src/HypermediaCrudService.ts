import * as crudPage from 'hr.widgets.CrudPage';
import * as pageWidget from 'hr.widgets.PageNumberWidget';
import * as di from 'hr.di';
export { CrudSearch, CrudPageNumbers, CrudTableController, CrudItemEditorController, CrudItemEditorType } from 'hr.widgets.CrudPage';
import * as ep from 'hr.externalpromise';
import * as deeplink from 'hr.deeplink';
import * as crudService from 'hr.widgets.CrudService';

export interface HypermediaPageInjectorOptions {
    /**
     * Determine if the query of the current page should be used as the first load's
     * query or not. Defaults to true. If you only have a single table and want deep linking
     * keep this to true, if the crud table you are creating is part of a larger page, you 
     * probably want to set this to false.
     */
    usePageQueryForFirstLoad?: boolean;

    /**
     * A unique name for the injector. If this is not provided it will be auto generated to 'hr.autonamed_hypermedia_injector_X'
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
    public createIdQuery(id: string): {} | null{
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
        if(query !== null){
            var results = await this.list(query);
            if(results.data.total > 0){
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

    public get uniqueName(): string {
        return this._uniqueName;
    }
}

export abstract class HypermediaChildPageInjector<T extends HypermediaCrudDataResult> extends HypermediaPageInjector {
    private parentResult: T;

    constructor(options?: HypermediaPageInjectorOptions) {
        if(options === undefined){
            options = {};
        }
        else{
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

    public getDeletePrompt(item: HypermediaCrudDataResult): string{
        return "Are you sure you want to delete this item?";
    }
}

export abstract class AbstractHypermediaChildPageInjector<T extends HypermediaCrudDataResult> extends HypermediaChildPageInjector<T> {
    constructor(options?: HypermediaPageInjectorOptions) {
        super(options);
    }

    public getDeletePrompt(item: HypermediaCrudDataResult): string{
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
    items: any;

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

    constructor(private pageInjector: HypermediaPageInjector, private linkManager: deeplink.IDeepLinkManager) {
        super();
        if(!this.linkManager){
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
        return this.getAddItemSchema();
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
        //This ensures that we don't return an item schema until at least one page is loaded.
        await this.initialPageLoadPromise.Promise;
        if (IsSearchableCrudCollection(this.currentPage) && this.currentPage.hasListDocs()) {
            var docs = await this.currentPage.getListDocs();
            return docs.querySchema;
        }
    }

    public async add(item?: any) {
        if (item === undefined) {
            item = {};
        }
        this.fireAddItemEvent(new crudPage.ShowItemEditorEventArgs(item, a => this.finishAdd(a), this.currentPage));
    }

    private async finishAdd(data) {
        if (IsAddableCrudCollection(this.currentPage)) {
            await this.currentPage.add(data);
            this.fireCrudDataModifiedEvent(new crudService.CrudDataModifiedEventArgs());
            this.refreshPage();
        }
    }

    private async itemEditorClosed() {
        if(this.currentPage && this.allowCloseHistory){
            this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
        }
    }

    public async canAdd() {
        return IsAddableCrudCollection(this.currentPage) && this.currentPage.canAdd();
    }

    public async edit(item: HypermediaCrudDataResult) {
        await this.beginEdit(item, true);
    }

    private async beginEdit(item: HypermediaCrudDataResult, recordHistory: boolean){
        if(recordHistory){
            var itemId = this.pageInjector.getItemId(item);
            if(itemId !== null){
                this.linkManager.pushState(this.pageInjector.uniqueName, "Edit/" + itemId, null);
            }
        }
    
        if (IsHypermediaRefreshableResult(item) && item.canRefresh()) {
            item = await item.refresh();
        }
        var data = this.getEditObject(item);
        this.editData(item, data);
    }

    public canEdit(item: HypermediaCrudDataResult): boolean {
        return IsHypermediaUpdatableResult(item) && item.canUpdate();
    }

    public editData(item: HypermediaCrudDataResult, dataPromise: Promise<any>) {
        this.fireShowItemEditorEvent(new crudPage.ShowItemEditorEventArgs(dataPromise, a => this.finishEdit(a, item), item, () => this.itemEditorClosed()));
    }

    protected async getEditObject(item: HypermediaCrudDataResult) {
        return item.data;
    }

    private async finishEdit(data, item: HypermediaCrudDataResult) {
        if (IsHypermediaUpdatableResult(item)) {
            await item.update(data);
            this.fireCrudDataModifiedEvent(new crudService.CrudDataModifiedEventArgs());
            this.refreshPage();
        }
    }

    public async del(item: HypermediaCrudDataResult) {
        if (IsHypermediaDeleteableResult(item)) {
            await item.delete();
            this.fireCrudDataModifiedEvent(new crudService.CrudDataModifiedEventArgs());
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

    public getPage(query: any) {
        var replacePageUrl = true;
        if (this.pageInjector.usePageQueryForFirstLoad && this.initialLoad) { //No current page, use the url query instead of the one passed in
            var historyState = this.linkManager.getCurrentState();
            if(historyState) {
                query = historyState.query;
                var itemId = this.getEditIdFromPath(historyState.inPagePath);
                if(itemId !== null){
                    replacePageUrl = false;
                    var item = this.pageInjector.getById(itemId).then(r =>{
                        if(r !== null){
                            this.beginEdit(r, false);
                        } 
                    });
                }
            }
        }
        var loadingPromise = this.getPageAsync(query, !this.initialLoad);
        if (this.initialLoad) {
            this.initialLoad = false;
            loadingPromise = loadingPromise
                .then(r => {
                    if(replacePageUrl){
                        this.linkManager.replaceState(this.pageInjector.uniqueName, null, this.currentPage.data);
                    }
                    this.initialPageLoadPromise.resolve(r);
                    return r;
                });
        }

        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(loadingPromise));
        return loadingPromise;
    }

    private async getPageAsync(query: any, recordHistory: boolean) {
        if (await this.pageInjector.canList()) {
            this.currentPage = await this.pageInjector.list(query);
            if (recordHistory) {
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
            }
            return this.currentPage;
        }
        else {
            throw new Error("No permissions to list, cannot get page.");
        }
    }

    public firstPage() {
        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.firstPageAsync()));
    }

    private async firstPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canFirst()) {
                this.currentPage = await this.currentPage.first();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
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
        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.lastPageAsync()));
    }

    private async lastPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canLast()) {
                this.currentPage = await this.currentPage.last();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
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
        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.nextPageAsync()));
    }

    private async nextPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canNext()) {
                this.currentPage = await this.currentPage.next();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
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
        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.previousPageAsync()));
    }

    private async previousPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canPrevious()) {
                this.currentPage = await this.currentPage.previous();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
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
        this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(this.refreshPageAsync()));
    }

    private async refreshPageAsync() {
        if (this.currentPage) {
            if (this.currentPage.canRefresh()) {
                this.currentPage = await this.currentPage.refresh();
                this.linkManager.pushState(this.pageInjector.uniqueName, null, this.currentPage.data);
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
        if(itemId !== null) {
            var item = await this.pageInjector.getById(itemId);
            if(item !== null){
                this.beginEdit(item, false);
            }
        }
        else{
            var loadingPromise = this.getPageAsync(args.query, false);
            this.fireDataLoadingEvent(new crudPage.DataLoadingEventArgs(loadingPromise));
            this.allowCloseHistory = false;
            this.fireCloseItemEditorEvent();
            this.allowCloseHistory = true;
        }
    }

    /**
     * Get the edit id of the current path, will be null if the current path is not an edit path.
     * @param inPagePath 
     */
    private getEditIdFromPath(inPagePath: string): string | null{
        if(inPagePath) {
            var split = inPagePath.split("/"); //Deep link paths will always start with a /, so add 1 to expected indices
            if(split.length >=3 && split[1].toLowerCase() === "edit"){
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