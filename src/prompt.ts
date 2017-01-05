"use strict"

export interface Prompt{
    prompt(message, defaultText): Promise<PromptResult>;
}

export class PromptResult {
    private accepted: boolean;
    private data: string;

    constructor(accepted: boolean, data: string) {
        this.accepted = accepted;
        this.data = data;
    }

    public isAccepted(): boolean {
        return this.accepted;
    }

    public getData(): string {
        return this.data;
    }
}

/**
 * A simple prompt that uses the browser prompt function, this wraps that function in a promise
 * so it matches the other prompt interfaces.
 */
export class BrowserPrompt implements Prompt {
    prompt(message, defaultText) {
        return new Promise<PromptResult>(function (resovle, reject) {
            var data = window.prompt(message, defaultText);
            var result = new PromptResult(data !== null, data);
            resovle(result);
        });
    }
}