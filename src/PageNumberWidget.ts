import * as events from 'htmlrapier/src/eventdispatcher';
import * as controller from "hr.controller";

/**
 * A toggle that is on, off or active.
 */
export class OnOffActiveToggle extends controller.OnOffToggle {
    private static activeStates = ['on', 'off', 'active'];

    public active() {
        this.applyState("active");
    }

    public getPossibleStates() {
        return OnOffActiveToggle.activeStates;
    }
}

interface PageNumberModel {
    pageNum: number;
}

export interface PageNumberState {
    canFirst: boolean;
    canLast: boolean;
    canPrevious: boolean;
    canNext: boolean;
    currentPage: number;
    totalPages: number;
    itemStart: number;
    itemEnd: number;
    total: number;
    offset: number;
    limit: number;
}

export interface OffsetLimitTotal {
    offset?: number;
    limit?: number;
    total?: number;
}

export interface HypermediaPageData {
    data: OffsetLimitTotal;
    canFirst(): boolean;
    canPrevious(): boolean;
    canNext(): boolean;
    canLast(): boolean;
}

export class HypermediaPageState implements PageNumberState {
    public canFirst: boolean;
    public canLast: boolean;
    public canPrevious: boolean;
    public canNext: boolean;
    public currentPage: number;
    public totalPages: number;
    public itemStart: number;
    public itemEnd: number;
    public total: number;
    public offset: number;
    public limit: number;

    constructor(pageData: HypermediaPageData) {
        var loc = pageData.data;
        this.currentPage = loc.offset;
        this.totalPages = 0;
        if (loc.offset !== undefined && loc.limit !== undefined && loc.limit !== 0 && loc.total !== undefined) {
            this.totalPages = Math.floor(loc.total / loc.limit);
            if (loc.total % loc.limit > 0) {
                ++this.totalPages;
            }
        }
        this.canFirst = pageData.canFirst();
        this.canPrevious = pageData.canPrevious();
        this.canNext = pageData.canNext();
        this.canLast = pageData.canLast();

        this.itemStart = pageData.data.offset * pageData.data.limit;
        this.itemEnd = this.itemStart + pageData.data.limit;
        ++this.itemStart; //Increment so we start at 1 not 0.
        this.total = pageData.data.total;
        //Make sure we are displaying the correct number of items.
        if (this.itemEnd > this.total) {
            this.itemEnd = this.total;
        }
        this.offset = pageData.data.offset;
        this.limit = pageData.data.limit;
    }
}

export class PageEventArgs {
    private _page: number;

    constructor(page: number) {
        this._page = page;
    }

    public get page() {
        return this._page;
    }
}

export class PageNumberWidgetOptions {
    private _parentController: any;
    public loadPageFunctionBaseName;
    public toggleBaseName;
    public modelBaseName;
    public firstToggleName;
    public previousToggleName;
    public nextToggleName;
    public lastToggleName;

    public firstCallbackFuncName;
    public previousCallbackFuncName;
    public nextCallbackFuncName;
    public lastCallbackFuncName;

    constructor(parentController: any) {
        this._parentController = parentController;
        this.loadPageFunctionBaseName = "page";
        this.toggleBaseName = "page";
        this.modelBaseName = "page";

        this.firstToggleName = "first";
        this.previousToggleName = "previous";
        this.nextToggleName = "next";
        this.lastToggleName = "last";

        this.firstCallbackFuncName = "pageFirst";
        this.previousCallbackFuncName = "pagePrevious";
        this.nextCallbackFuncName = "pageNext";
        this.lastCallbackFuncName = "pageLast";
    }

    public get parentController() {
        return this._parentController;
    }
}

export class PageNumberWidget {
    private firstToggle: controller.OnOffToggle;
    private previousToggle: controller.OnOffToggle;
    private nextToggle: controller.OnOffToggle;
    private lastToggle: controller.OnOffToggle;

    private pageNumberToggles: OnOffActiveToggle[] = [];
    private pageNumberModels: controller.Model<PageNumberModel>[] = [];
    private halfPageButtonTotal: number;
    private startIndex: number;

    private loadPageEventDispatcher = new events.ActionEventDispatcher<PageEventArgs>();
    private loadFirstEventDispatcher = new events.ActionEventDispatcher<PageNumberWidget>();
    private loadPreviousEventDispatcher = new events.ActionEventDispatcher<PageNumberWidget>();
    private loadNextEventDispatcher = new events.ActionEventDispatcher<PageNumberWidget>();
    private loadLastEventDispatcher = new events.ActionEventDispatcher<PageNumberWidget>();

    private currentState: PageNumberState;

    constructor(bindings: controller.BindingCollection, options: PageNumberWidgetOptions) {
        var pageToggle: OnOffActiveToggle;
        var lookup: boolean = true;
        var parentController = options.parentController;
        var i = 0;
        while (lookup) {
            pageToggle = bindings.getCustomToggle<OnOffActiveToggle>(options.toggleBaseName + i, new OnOffActiveToggle());
            lookup = pageToggle.isUsable();
            if (lookup) {
                this.pageNumberToggles.push(pageToggle);
                parentController[options.loadPageFunctionBaseName + i] = this.pageEventClojureCreator(i);
                this.pageNumberModels.push(bindings.getModel<PageNumberModel>(options.modelBaseName + i));
            }
            ++i;
        }
        this.halfPageButtonTotal = Math.floor(this.pageNumberModels.length / 2);

        this.firstToggle = bindings.getToggle(options.firstToggleName);
        this.previousToggle = bindings.getToggle(options.previousToggleName);
        this.nextToggle = bindings.getToggle(options.nextToggleName);
        this.lastToggle = bindings.getToggle(options.lastToggleName);

        //Setup remaining functions
        parentController[options.firstCallbackFuncName] = (evt: Event) => { this.fireNavEvent(evt, this.currentState.canFirst, this.loadFirstEventDispatcher); };
        parentController[options.previousCallbackFuncName] = (evt: Event) => { this.fireNavEvent(evt, this.currentState.canPrevious, this.loadPreviousEventDispatcher); };
        parentController[options.nextCallbackFuncName] = (evt: Event) => { this.fireNavEvent(evt, this.currentState.canNext, this.loadNextEventDispatcher); };
        parentController[options.lastCallbackFuncName] = (evt: Event) => { this.fireNavEvent(evt, this.currentState.canLast, this.loadLastEventDispatcher); };
    }

    public setState(state: PageNumberState) {
        //Try to get the current page into the middle
        this.currentState = state;
        this.startIndex = state.currentPage - this.halfPageButtonTotal;
        if (this.startIndex < 0) {
            this.startIndex = 0;
        }

        var shiftedCurrent = state.currentPage - this.startIndex;

        //Layout pages from start index.
        var i: number;
        for (i = 0; i < this.pageNumberToggles.length && i + this.startIndex < state.totalPages; ++i) {
            if (i === shiftedCurrent) {
                this.pageNumberToggles[i].active();
            }
            else {
                this.pageNumberToggles[i].on();
            }
            this.pageNumberModels[i].setData({
                pageNum: i + this.startIndex + 1
            });
        }

        //Turn off extra toggles
        for (; i < this.pageNumberToggles.length; ++i) {
            this.pageNumberToggles[i].off();
        }

        //Check other toggles
        PageNumberWidget.setNavigatorToggle(state.canFirst, this.firstToggle);
        PageNumberWidget.setNavigatorToggle(state.canPrevious, this.previousToggle);
        PageNumberWidget.setNavigatorToggle(state.canNext, this.nextToggle);
        PageNumberWidget.setNavigatorToggle(state.canLast, this.lastToggle);
    }

    private static setNavigatorToggle(canNav: boolean, navToggle: controller.OnOffToggle) {
        if (canNav) {
            navToggle.on();
        }
        else {
            navToggle.off();
        }
    }

    public get loadPageEvent() {
        return this.loadPageEventDispatcher.modifier;
    }

    public get loadFirstEvent() {
        return this.loadFirstEventDispatcher.modifier;
    }

    public get loadPreviousEvent() {
        return this.loadPreviousEventDispatcher.modifier;
    }

    public get loadNextEvent() {
        return this.loadNextEventDispatcher.modifier;
    }

    public get loadLastEvent() {
        return this.loadLastEventDispatcher.modifier;
    }

    private pageEventClojureCreator(index: number) {
        return (evt: Event) => {
            evt.preventDefault();
            this.loadPageEventDispatcher.fire(new PageEventArgs(this.startIndex + index));
        }
    }

    private fireNavEvent(evt: Event, ableToRespond: boolean, dispatcher: events.ActionEventDispatcher<PageNumberWidget>) {
        evt.preventDefault();
        if (ableToRespond) {
            dispatcher.fire(this);
        }
    }
}