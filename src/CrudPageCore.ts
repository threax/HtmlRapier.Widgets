import * as controller from 'hr.controller';
import * as hyperCrudPage from 'hr.widgets.HypermediaCrudService';

export type HypermediaPageInjectorConstructor = Function & {
    InjectorArgs: controller.InjectableArgs;
    prototype: hyperCrudPage.HypermediaPageInjector
};

export class Settings {
    searchName = "search";
    pageNumbersName = "pageNumbers";
    mainTableName = "mainTable";
    entryEditorName = "entryEditor";
}

/**
 * 
 * @param injector
 */
export function addServices(builder: controller.InjectedControllerBuilder, injector: HypermediaPageInjectorConstructor): void {
    hyperCrudPage.addServices(builder.Services);
    builder.Services.tryAddShared(hyperCrudPage.HypermediaPageInjector, injector);
}

/**
 * Create the controllers for the crud page.
 */
export function createControllers(builder: controller.InjectedControllerBuilder, settings: Settings): void {
    builder.create(settings.searchName, hyperCrudPage.CrudSearch);
    builder.create(settings.pageNumbersName, hyperCrudPage.CrudPageNumbers);
    builder.create(settings.mainTableName, hyperCrudPage.CrudTableController);
    builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
}