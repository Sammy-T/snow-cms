import { config, backend } from '$stores';
import { get } from 'svelte/store';
import { parseFileType, parseLinks } from '$lib/util';
import { constructAssetDocFromFile, constructDocFromFile } from './util/local/doc';
import { directoryOpen, fileOpen, fileSave } from 'browser-fs-access';

/** 
 * These type definitions illustrate the required properties for content document objects.
 * Implementations can add additional properties as needed.
 */

/**
 * An object containing the data of the content file's field metadata (used to form front matter).
 * @typedef Fields
 * @type {object}
 * @property {String} title
 * @property {Date|String} date
 * @property {boolean} draft
 */

/**
 * An object containing the content file's data.
 * @typedef Doc
 * @type {object}
 * @property {String} name - The name of the file. (including file extension)
 * @property {String} collection - The name of the collections.
 * @property {Date|String} date
 * @property {String} raw - The raw contents of the file.
 * @property {Fields} fields
 * @property {String} body - The contents of the file. (excluding frontmatter)
 */

/**
 * An object containing the asset file's data.
 * @typedef AssetDoc
 * @type {object}
 * @property {String} name - The name of the file. (including file extension)
 * @property {String} url - The public path/url to the asset.
 * @property {String} url_preview - The url used to preview the asset.
 */

/**
 * @typedef LoginConfig
 * @type {object}
 * @property {String|undefined} title 
 * @property {String|undefined} message
 * @property {String|undefined} button - The text displayed by the button.
 * @property {object|undefined} fields - Fields to include on the login form. `{ inputName: 'inputType' }`
 * @property {function(FormData): Promise<void>} action - The action to perfom on login form submission.
 */

// [Imported from PouchDB]
let PouchDB;
let PouchDBIdb;
let PouchDBFind;
// [end]

/** @type {String} */
let repoFolder;

/** @see PouchDB.Database */
let db;

/** @type {FileSystemDirectoryHandle} */
let rootDirHandle;

/**
 * Initializes the backend.
 * @returns The backend.
 */
async function init() {
    repoFolder = get(config).repo_folder;

    if(!repoFolder) {
        console.error(`Missing 'repo_folder' config`);
        return;
    }

    await importPouchDB();

    // Set up PouchDB
    PouchDB.plugin(PouchDBIdb);
    PouchDB.plugin(PouchDBFind);

    db = new PouchDB(`${repoFolder}-local`, { adapter: 'idb' });

    /**
     * Set up the indices.
     * 
     * When indexing multiple fields, the field to sort by NEEDS to be first.
     * This is INSANELY important and not well documented IMO.
     * THIS NEEDS TO BE IN BIG BOLD F*CKING LETTERS ON THE POUCHDB DOCS.
     * 
     * @see {@link https://github.com/pouchdb/pouchdb/issues/6399#issuecomment-1027875393}
     * @see {@link https://github.com/pouchdb/pouchdb/issues/7207}
     */
    const indices = [
        ['name', 'collection'], 
        ['date', 'collection'],
        ['asset'],
        ['url'],
        ['url_preview']
    ];

    indices.map(fields => {
        return { 
            index: { fields },
            ddoc: fields.join('-'), 
        };
    }).forEach(index => createDbIndex(index));

    console.log('Using local CMS backend');

    return local;
}

/**
 * A helper to dynamically import PouchDB
 */
async function importPouchDB() {
    PouchDB = (await import('pouchdb-core')).default;
    PouchDBIdb = (await import('pouchdb-adapter-idb')).default;
    PouchDBFind = (await import('pouchdb-find')).default;
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
    /** @see {LoginConfig} */
    const loginConfig = {
        title: 'Local Backend Enabled',
        message: 'Select the local project directory to continue.',
        button: 'Select Project Directory',
        action: selectDirectory
    };

    return loginConfig;
}

async function createDbIndex(index) {
    try {
        const result = await db.createIndex(index);
        console.log(`Create index`, index, result);
    } catch(error) {
        console.error('Create index error', error);
    }
}

/**
 * Searches for an existing doc and updates the `_rev` field
 * of the passed in doc if an existing one is found.
 * @param {*} doc 
 */
async function findExisting(doc) {
    try {
        const existing = await db.get(doc['_id']);

        // Set the _rev field to our constructed doc.
        // This field is needed to update the doc if it already exists.
        doc['_rev'] = existing['_rev'];
    } catch(error) {
        console.warn('Existing doc error', error);
    }
}

/**
 * Triggers a directory selection dialog then retrieves the files 
 * within the configured collection folder(s) from the selected directory.
 */
async function selectDirectory() {
    if(!repoFolder) return;

    /** @type {Array<{name: string, regex: RegExp}>} */
    const collectionRegexes = [];

    const cfg = get(config);

    const collections = cfg.collections;

    collections.forEach(collection => {
        const directories = collection.folder.split('/');

        // Match strings containing the collection path
        // but exclude filenames starting with underscores.
        const collectionPath = directories.join('\\/');
        const pattern = `\\/?${collectionPath}\\/[^_][\\w-]+\\.\\w+`;

        collectionRegexes.push({ name: collection.name, regex: new RegExp(pattern, 'i') });
    });

    const mediaFolder = cfg.media_folder;
    const mediaPath = mediaFolder.split('/').join('\\/');
    const mediaPattern = `\\/?${mediaPath}\\/[^_][\\w-]+\\.\\w+`;
    const mediaRegex = new RegExp(mediaPattern, 'i');

    const skipDirs = ['node_modules'];
    
    const options = {
        recursive: true,
        id: `snow-cms-${repoFolder}`,
        skipDirectory: (entry) => entry.name.startsWith('.') || skipDirs.includes(entry.name)
    };

    try {
        const files = await directoryOpen(options);

        const mediaDocs = [];
        const docPromises = [];

        // Filter out the files not contained in the collection directories
        // or that have filenames we're ignoring.
        files.forEach((file) => {
            if(!rootDirHandle && file.directoryHandle?.name === repoFolder) {
                rootDirHandle = file.directoryHandle;
            }

            const isValidMedia = mediaRegex.test(file.webkitRelativePath);

            if(isValidMedia) {
                mediaDocs.push(constructAssetDocFromFile(cfg, file));
                return;
            }

            const regexEntry = collectionRegexes.find(({name, regex}) => regex.test(file.webkitRelativePath));

            if(regexEntry) {
                docPromises.push(constructDocFromFile(regexEntry.name, file));
            }
        });

        // Await the construction of all docs
        const docs = await Promise.all(docPromises);
        docs.push(...mediaDocs);

        const findPromises = [];

        docs.forEach((doc) => findPromises.push(findExisting(doc)));

        // Await finding all existing docs
        await Promise.all(findPromises);

        // Update the db
        const result = await db.bulkDocs(docs);

        backend.set(local);
    } catch(error) {
        console.error('Open directory error', error);
    }
}

/**
 * Gets the docs corresponding to the content files within the given collection.
 * @param {String} collectionName 
 * @returns {Promise<object[]>} A promise for an array of the documents.
 */
async function getFiles(collectionName) {
    try {
        const result = await db.find({
            selector: {
                collection: collectionName,
                date: { $gte: null }
            },
            sort: [
                { date: 'desc' }
            ]
        });

        return result.docs;
    } catch(error) {
        console.error('Error finding docs', error);
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
    const repoFolder = get(config).repo_folder;

    // Add the doc id if missing
    if(!doc._id) doc._id = [repoFolder, collection.folder, doc.name].join('/');

    try {
        const ext = `.${collection.extension}`;

        // Create the save ID and limit its length to 32 chars.
        const saveId = `snow-cms-save-${repoFolder}-${collection.folder.split(/[\/\\]/).at(-1)}`.substring(0, 32);

        const saveOpts = {
            fileName: doc.name,
            extensions: [ext],
            id: saveId
        };

        const blob = new Blob([doc.raw], { type: parseFileType(ext) });

        // Save the file locally
        if(doc.handle) {
            await fileSave(blob, saveOpts, doc.handle, true);
        } else {
            let handle = await fileSave(blob, saveOpts);
            doc.handle = handle; // Update the handle
        }

        // Save the file to the db
        const resp = await db.put(doc);
        console.log(resp);

        doc._rev = resp.rev; // Update the rev

        return doc;
    } catch(error) {
        console.error('Save file error', error);
        throw error;
    }
}

/**
 * Deletes the files associated with the provided docs.
 * @param {object[]} docs 
 */
async function deleteFiles(docs) {
    try {
        docs.forEach(doc => doc._deleted = true);

        // Delete the docs from the db
        const result = await db.bulkDocs(docs);
        console.log(result);

        const delPromises = [];

        docs.forEach(doc => {
            if(!doc.handle) return;

            // Delete the local file
            delPromises.push(doc.handle.remove());
        });

        await Promise.all(delPromises);
    } catch(error) {
        console.error('Delete files error', error);
        throw error;
    }
}

/**
 * Gets the docs for all media files.
 * @returns {Promise<object[]>} A promise for an array of the documents.
 */
async function getMediaFiles() {
    try {
        const result = await db.find({
            selector: {
                asset: { $gt: '' }
            }
        });

        return result.docs;
    } catch(error) {
        console.error('Error finding docs', error);
        return null;
    }
}

/**
 * Opens a dialog to select a file to upload, opens a save dialog to 
 * save the selected file to disk, and saves the doc to the local db.
 * ---
 * I wish this didn't open two dialogs but.. yeah.. this is where we are.
 */
async function uploadMediaFile() {
    try {
        const openOpts = {
            mimeTypes: ['image/*'],
            description: 'Image Files',
        };

        // Select a file to upload
        const file = await fileOpen(openOpts);

        const ext = '.' + file.name.split('.').at(-1);
        const saveOpts = {
            fileName: file.name,
            extensions: [ext],
            id: `snow-cms-upload-${repoFolder}`
        };

        // Save a new file
        const saveResp = await fileSave(file, saveOpts);

        if(!rootDirHandle) {
            console.warn('File not saved to db: No root dir handle found.');
            return;
        }
        
        // Rebuild the necessary file fields since the save response
        // will only contain the new file handle.
        const relativePath = await rootDirHandle.resolve(saveResp);
        relativePath.unshift(rootDirHandle.name);

        const newFile = {
            name: saveResp.name,
            lastModifiedDate: new Date(),
            type: file.type,
            webkitRelativePath: relativePath.join('/'),
            handle: saveResp,
        };

        // @ts-ignore
        const doc = constructAssetDocFromFile(get(config), newFile);

        // Save the file to the db
        const resp = await db.put(doc);
        console.log(resp);
    } catch(error) {
        console.error('Upload file error', error);
    }
}

/**
 * Searches the db for asset docs with `url` or `url_preview` properties
 * that match the provided urls.
 * @param {String} urlType - The url type to search for. `'public' | 'preview'`
 * @param {String[]} urls - The urls to search for.
 */
async function findDocsWithUrls(urlType, urls) {
    const resultPromises = [];

    // Find the docs with the matching public / preview url(s)
    urls.forEach(url => {
        /** @see PouchDB.Find.FindRequest */
        const query = {};

        if(urlType === 'public') {
            query.selector = {
                url: url
            };
        } else {
            query.selector = {
                url_preview: url
            };
        }

        const promise = db.find(query);

        resultPromises.push(promise);
    });

    // Await all the query results
    const results = await Promise.all(resultPromises);

    const docs = [];

    // Compile the docs
    results.forEach(result => docs.push(...result.docs));

    return docs;
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
        const docs = await findDocsWithUrls('public', links);

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
        const docs = await findDocsWithUrls('preview', links);

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

const local = {
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

export default local;
