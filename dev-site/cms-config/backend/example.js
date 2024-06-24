/**
 * This file contains examples of all the 
 * necessary functions required for a custom backend.
 * 
 * Try it out by setting the config.yml file's 
 * `local_backend` property to false and the
 * `backend/file` property to 'backend/example.js'. 
 */

/** 
 * The store for the `config.yml` file. 
 * @type {import('svelte/store').Readable}
 */
let config;

/** @type {import('svelte/store').Writable} */
let backend;

/** @type {import('svelte/store').get} */
let get;

/** @type {function(String): String[]} */
let getContents;

/** @type {function(String): String[]} */
let parseLinks;

/** @type {function(Object | Object[]): Promise<import('browser-fs-access').FileWithHandle>} */
let fileOpen;

/** 
 * An array used to emulate an example database for this backend.
 * ***
 * An actual backend should interact with a real database / API.
 */
let exampleDb = [];

let docId = 0;

/**
 * Initializes the backend.
 * @param {*} cfg - The backend config object containing exposed stores and functions. See: cms/src/lib/util.js
 * @returns The backend.
 */
async function init(cfg) {
    const { configStore, backendStore, getStoreValueFunc, getContentsFunc, parseLinksFunc, fileOpenFunc } = cfg;

    // Configure the backend's variables
    config = configStore;
    backend = backendStore;
    get = getStoreValueFunc;
    getContents = getContentsFunc;
    parseLinks = parseLinksFunc;
    fileOpen = fileOpenFunc;

    // Configure this backend in the backend store.
    //
    // IMPORTANT: Set this only when the backend has finished initializing
    // and is ready to interact with the CMS.
    backend.set(example);

    // The `get()` function can be used to read `config.yml` info from the `config` store. 
    console.log(`Using custom CMS backend '${get(config).backend.file}'`);

    return example;
}

/**
 * A helper to configure the login page.
 * 
 * This should only be exported if the backend requires some sort of login / user interaction
 * to set up.
 * ***
 * **IMPORTANT:** If exported, `backend.set()` should not be called in `init()`.
 */
async function getLoginConfig() {
    /**
     * The action to perform on login form submission.
     * @param {FormData} data 
     */
    async function loginAction(data) {
        let msg = [];

        for(const [key, value] of data.entries()) {
            msg.push(`${key}: ${value}`);
        }

        console.log(msg.join('\n'));

        // Configure this backend in the backend store.
        backend.set(example);
    }

    //// TODO: type
    const loginConfig = {
        title: 'Example Backend Enabled',
        message: 'This is an example login.',
        button: 'Log in',
        fields: {
            username: 'text',
            email: 'email',
            password: 'password'
        },
        action: loginAction
    };

    return loginConfig;
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
    exampleDb = [...exampleDb.filter(checkDoc => docs.every(delDoc => checkDoc.id !== delDoc.id))];
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

const example = {
    init,
    // getLoginConfig,
    getFiles,
    saveFile,
    deleteFiles,
    getMediaFiles,
    uploadMediaFile,
    replacePublicLinks,
    replacePreviewLinks
};

export default example;
