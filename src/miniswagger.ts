import * as http from 'hr.http';

/**
 * This object holds any swagger docs we have already downloaded.
 * @param {string} url
 */
var downloadedDocs = {};

/**
 * Download the swagger doc at url and return it as an object.
 * @param {string} url The url to get the swagger doc from.
 * @returns The swagger json turned into an object.
 */
export function getSwaggerDoc(url: string): Promise<any> {
    if (downloadedDocs[url] === undefined) {
        downloadedDocs[url] = http.get(url);
    }
    return Promise.resolve(downloadedDocs[url]);
}

/**
 * Get the object schemas from a swagger doc.
 * @param {string} url The url to load the swagger doc from.
 * @returns An object with all the swagger model definitions in json schema format.
 */
export function getSwaggerObjectSchemas(url: string) {
    return getSwaggerDoc(url)
        .then(function (doc) {
            return doc.definitions;
        });
}