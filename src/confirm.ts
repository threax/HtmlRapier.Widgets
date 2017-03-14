"use strict"

export abstract class IConfirm{
    public abstract confirm(message:string):Promise<boolean>;
}

/**
 * A simple confirm that uses the browser confirm function, this wraps that function in a promise
 * so it matches the other prompt interfaces.
 */
export class BrowserConfirm implements IConfirm {
    confirm(message:string) {
        return new Promise(function (resovle, reject) {
            if (window.confirm(message)) {
                resovle(true);
            }
            else {
                resovle(false);
            }
        });
    }
}