"use strict"

export abstract class IAlert{
    public abstract alert(message:string);
}

/**
 * A simple confirm that uses the browser confirm function, this wraps that function in a promise
 * so it matches the other prompt interfaces.
 */
export class BrowserAlert implements IAlert {
    alert(message:string) {
        window.alert(message);
    }
}