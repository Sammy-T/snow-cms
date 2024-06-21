import { config, backend } from '$stores';
import { get } from 'svelte/store';
import { parseFileType, parseLinks } from '$lib/util';
import { directoryOpen, fileOpen, fileSave } from 'browser-fs-access';
import { Octokit } from '@octokit/core';

/** 
 * An array used to emulate an example database for this backend.
 * ***
 * An actual backend should interact with a real database / API.
 */
let exampleDb = [];

let docId = 0;

const cmsUrl = `${window.location.origin}${window.location.pathname}`;

const storagePrefix = 'SNOW_CMS:';

const STORAGE_KEYS = {
    state: `${storagePrefix}:GH_AUTH:STATE`
};

let octokit;

/**
 * Initializes the backend.
 * @returns The backend.
 */
async function init() {
    const params = new URLSearchParams(window.location.search);

    const code = params.get('code');
    const receivedState = params.get('state');

    const state = localStorage.getItem(STORAGE_KEYS.state);

    if(code && state) {
        if(receivedState === state) {
            console.log('Valid auth state');

            /**
             * Clear the params from the location 
             * by replacing the history state.
             * 
             * (This method avoids a page reload.)
             */
            history.replaceState({}, '', cmsUrl);

            const backendCfg = get(config).backend;

            const apiRoot = backendCfg.api_root ?? window.location.origin;
            const authEndpoint = backendCfg.auth_endpoint ?? '/api/github/oauth/token';

            const data = { code };

            // Exchange code for token
            const resp = await fetch(`${apiRoot}${authEndpoint}`, {
                method: 'post',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const respJson = await resp.json();
            
            if(!resp.ok) throw new Error(respJson.error ?? 'Token error');

            const { authentication } = respJson;
            console.log('authentication', authentication); //// TODO:

            octokit = new Octokit({ auth: authentication.token });

            //// TODO: TEMP
            const { data: { login } } = await octokit.request("GET /user");
            console.log(`Hi ${login}`);

            // Configure this backend in the backend store
            backend.set(github);
        } else {
            localStorage.removeItem(STORAGE_KEYS.state);

            throw new Error('Invalid auth state');
        }
    }

    console.log(`Using GitHub CMS backend`);

    return github;
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
        const url = new URL('https://github.com/login/oauth/authorize');

        /**
         * The web flow's auth state.
         * 
         * @see {@link https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-web-application-flow-to-generate-a-user-access-token}
         */
        const state = Math.random().toString(36).substring(2);

        const params = url.searchParams;
        params.set('client_id', get(config).backend.client_id);
        params.set('redirect_uri', cmsUrl);
        params.set('state', state);

        localStorage.setItem(STORAGE_KEYS.state, state);

        // Redirect to the GitHub auth url
        window.location.assign(url.href);
    }

    const loginConfig = {
        title: 'GitHub Log in',
        button: 'Log in with GitHub',
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
