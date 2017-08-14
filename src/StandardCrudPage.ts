import * as controller from 'hr.controller';
import * as hyperCrudPage from 'hr.widgets.HypermediaCrudService';

export type HypermediaPageInjectorConstructor = Function & {
    InjectorArgs: controller.InjectableArgs;
    prototype: hyperCrudPage.HypermediaPageInjector
};

export class Settings {
    searchName: string = "search";
    pageNumbersName: string = "pageNumbers";
    mainTableName: string = "mainTable";
    entryEditorName: string = "entryEditor";
    addItemEditorName: string | null = "addEntryEditor";
}

/**
 * This function will setup services for a crud page. This makes it easy to get a crud page working
 * without needing a lot of extra code per instance. If you need to do something other than what this
 * standard can provide, do it yourself.
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

    //Its possible that the add item editor name is null, which means we shouldn't try to create it.
    if(settings.addItemEditorName === null) {
        builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
    }
    else {
        //Try to create the add item editor
        var addEditor = builder.createId(hyperCrudPage.CrudItemEditorType.Add, settings.addItemEditorName, hyperCrudPage.CrudItemEditorController);
        if(addEditor.length === 0) {
            //If we were unable to create an add item editor share the editor instead
            builder.create(settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
        }
        else{
            //If we were able to create the add item editor, create a separate update editor
            builder.createId(hyperCrudPage.CrudItemEditorType.Update, settings.entryEditorName, hyperCrudPage.CrudItemEditorController);
        }
    }
}