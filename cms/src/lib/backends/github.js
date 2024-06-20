import { config, backend } from '$stores';
import { get } from 'svelte/store';
import { parseFileType, parseLinks } from '$lib/util';
import { directoryOpen, fileOpen, fileSave } from 'browser-fs-access';

/** 
 * An array used to emulate an example database for this backend.
 * ***
 * An actual backend should interact with a real database / API.
 */
let exampleDb = [];

let docId = 0;

//// TODO: Implement GH interaction
/**
 * Initializes the backend.
 */
async function init() {
    //// TODO: Configure this backend in the backend store
    // backend.set(github);

    console.log(`Using GitHub CMS backend`);

    return github;
}

/**
 * Gets the docs corresponding to the content files within the given collection.
 * @param {String} collectionName 
 * @returns {Promise<object[]>} A promise for an array of the documents.
 */
async function getFiles(collectionName) {
    try {
        const compareDoc = (a, b) => b.date.getTime() - a.date.getTime();

        const docs = exampleDb.filter(doc => doc.collection === collectionName).sort(compareDoc) ?? [];

        return docs;
    } catch(error) {
        console.error('Error fetching files', error);
        throw error;
    }
}

/**
 * Alters the provided doc if necessary and saves it.
 * @param {*} collection 
 * @param {*} doc 
 * @returns The saved doc.
 */
async function saveFile(collection, doc) {
    // Add additional properties to the doc if needed..
    if(doc.id == null) {
        doc.id = docId;

        docId++;
    }

    doc.collection = collection.name;
    
    try {
        // Add the doc
        exampleDb = [...exampleDb.filter(d => d.id !== doc.id), doc];

        return doc;
    } catch(error) {
        console.error('Error saving file', error);
        throw error;
    }
}

/**
 * Deletes the files associated with the provided docs.
 * @param {object[]} docs - The docs to delete.
 */
async function deleteFiles(docs) {
    // Revoke the object urls of asset docs.
    docs.forEach(delDoc => {
        if(delDoc.url_preview) URL.revokeObjectURL(delDoc.url_preview);
    });

    // Remove the matching docs
    exampleDb = [...exampleDb.filter(check => docs.every(delDoc => check.id !== delDoc.id))];
}

/**
 * Gets the docs for all media files.
 * @returns {Promise<object[]>} A promise for an array of the documents.
 */
async function getMediaFiles() {
    return exampleDb.filter(doc => doc.url_preview != null);
}

/**
 * Opens a dialog to select a file to upload 
 * and saves the doc to the example 'db'.
 */
async function uploadMediaFile() {
    try {
        const openOpts = {
            mimeTypes: ['image/*'],
            description: 'Image Files',
        };

        // Select a file to upload.
        const file = await fileOpen(openOpts);

        // Create an object url for the file.
        //
        // In an actual backend, you would want to appropriately
        // process / upload the file.
        const url = URL.createObjectURL(file);

        // Construct the doc
        const doc = {
            name: file.name,
            url: `this/is/just/an/example/${file.name}`,
            url_preview: url
        };

        // Add additional properties if needed...
        doc.id = docId;
        doc.date = new Date();
        doc.handle = file.handle;

        docId++;

        // Add the doc
        exampleDb.push(doc);
    } catch(error) {
        console.error('Upload file error', error);
    }
}

/**
 * Replaces the public links found in the string with their corresponding preview links.
 * @param {String} rawValue  
 */
async function replacePublicLinks(rawValue) {
    let processedValue = rawValue;

    try {
        // Parse the urls from the string
        const links = parseLinks(processedValue);

        if(links.length === 0) return rawValue;
        
        // Find the docs with matching urls
        const docs = exampleDb.filter(doc => doc.url && links.includes(doc.url));

        // Replace the public urls
        docs.forEach(doc => {
            processedValue = processedValue.replaceAll(doc.url, doc.url_preview);
        });

        return processedValue;
    } catch(error) {
        console.error('Error processing public links', error);
        throw error;
    }
}

/**
 * Replaces the preview links found in the string with their corresponding public links.
 * @param {String} rawValue  
 */
async function replacePreviewLinks(rawValue) {
    let processedValue = rawValue;

    try {
        // Parse the urls from the string
        const links = parseLinks(processedValue);

        if(links.length === 0) return rawValue;
        
        // Find the docs with matching urls
        const docs = exampleDb.filter(doc => doc.url_preview && links.includes(doc.url_preview));

        // Replace the preview urls
        docs.forEach(doc => {
            processedValue = processedValue.replaceAll(doc.url_preview, doc.url);
        });

        return processedValue;
    } catch(error) {
        console.error('Error processing preview links', error);
        throw error;
    }
}

const github = {
    init,
    getLoginConfig,
    getFiles,
    saveFile,
    deleteFiles,
    getMediaFiles,
    uploadMediaFile,
    replacePublicLinks,
    replacePreviewLinks
};

export default github;
