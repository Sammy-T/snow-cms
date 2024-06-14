import { config, backend } from '$stores';
import { get } from 'svelte/store';
import { createFilename, parseFileType, parseLinks } from '$lib/util';
import { directoryOpen, fileOpen, fileSave } from 'browser-fs-access';
import PouchDB from 'pouchdb-core';
import PouchDBIdb from 'pouchdb-adapter-idb';
import PouchDBFind from 'pouchdb-find';
import yaml from 'js-yaml';

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

/** @type {String} */
let repoFolder;

/** @type {PouchDB.Database} */
let db;

/** @type {FileSystemDirectoryHandle} */
let rootDirHandle;

function init() {
    repoFolder = get(config).repo_folder;

    if(!repoFolder) {
        console.error(`Missing 'repo_folder' config`);
        return;
    }

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
 * Constructs a PouchDB compatible doc from the provided file and its collection name.
 * @param {String} collectionName 
 * @param {*} file
 */
async function constructDoc(collectionName, file) {
    let raw;

    try {
        raw = await file.text();
    } catch(error) {
        console.error('Error constructing doc', error);
        return;
    }

    const [frontMatter, body] = getContents(raw);
    const fields = yaml.load(frontMatter);

    const doc = {
        _id: file.webkitRelativePath,
        name: file.name,
        collection: collectionName,
        date: fields['date'],
        raw,
        fields,
        body,
        handle: file.handle,
        directoryHandle: file.directoryHandle,
    };

    return doc;
}

/**
 * Constructs a PouchDB compatible doc from the provided asset file.
 * @param {*} file
 */
function constructAssetDoc(file) {
    const publicFolder = get(config).public_folder;
    const url = `${publicFolder}/${file.name}`;

    const doc = {
        _id: file.webkitRelativePath,
        name: file.name,
        date: file.lastModifiedDate,
        asset: file.type,
        url,
        url_preview: url,
        handle: file.handle,
        directoryHandle: file.directoryHandle
    };

    return doc;
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
 * Splits front matter prefixed text into a string array containing front matter and body.
 * @param {String} text 
 * @returns {Array<String>} `[frontmatter, body]`
 */
function getContents(text) {
    // If there's no beginning frontmatter delimiter, 
    // return an invalid date and the passed in text.
    if(!/^---(\r?\n)/.test(text.trim())) {
        return [`date: 0001-01-01T12:00:00-00:00`, text.trim()];
    }

    const fmToken = '---';
    const tmpToken = '{#{br}#}';
    
    // Replace the first two '---' front matter delimiters.
    // I'm not using `replaceAll` to preserve any remaining markdown horizontal rules.
    const marked = text.trim().replace(fmToken, tmpToken).replace(fmToken, tmpToken);
    const contents = marked.split(tmpToken).filter(m => m.length > 0).map(content => content.trim());

    return contents;
}

/**
 * Triggers a directory selection dialog then retrieves the files 
 * within the configured collection folder(s) from the selected directory.
 */
async function selectDirectory() {
    if(!repoFolder) return;

    const collectionRegexes = {};

    const collections = get(config).collections;

    collections.forEach(collection => {
        const directories = collection.folder.split('/');

        // Match strings containing the collection path
        // but exclude filenames starting with underscores.
        const collectionPath = directories.join('\\/');
        const pattern = `\\/?${collectionPath}\\/[^_][\\w-]+\\.\\w+`;

        collectionRegexes[collection.name] = new RegExp(pattern, 'i');
    });

    const mediaFolder = get(config).media_folder;
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
                mediaDocs.push(constructAssetDoc(file));
                return;
            }

            for(const name in collectionRegexes) {
                const isValid = collectionRegexes[name].test(file.webkitRelativePath);

                if(isValid) {
                    docPromises.push(constructDoc(name, file));
                }
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
 * Creates a doc from the provided entry/doc data and saves it.
 * @param {*} collection 
 * @param {*} entryData 
 * @returns The saved doc.
 */
async function saveFile(collection, entryData) {
    const doc = { ...entryData }; // Copy the entry data

    const { date, body } = doc.fields;
    delete doc.fields.body; // Remove the body from the fields data

    const frontMatter = yaml.dump(doc.fields, { quotingType: `"`, forceQuotes: true });

    doc.date = date;
    doc.body = body;
    doc.collection = collection.name;

    if(!doc.name) doc.name = createFilename(collection, doc.fields);

    if(!doc._id) doc._id = [get(config).repo_folder, collection.folder, doc.name].join('/');

    doc.raw = `---\n${frontMatter}---\n\n${doc.body}`;

    try {
        const ext = `.${collection.extension}`;

        const saveOpts = {
            fileName: doc.name,
            extensions: [ext]
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

        const doc = constructAssetDoc(newFile);

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
 * @param {String} urlType The url type to search for. `'public' | 'preview'`
 * @param {String[]} urls The urls to search for.
 */
async function findDocsWithUrls(urlType, urls) {
    const resultPromises = [];

    // Find the docs with the matching public / preview url(s)
    urls.forEach(url => {
        /** @type {PouchDB.Find.FindRequest} */
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

    console.log('matching docs', docs);

    return docs;
}

/**
 * Replaces the public links found in the string with their corresponding preview links.
 * @param {String} rawValue  
 */
async function replacePublicLinks(rawValue) {
    let processedValue = rawValue;

    try {
        const links = parseLinks(processedValue);

        if(links.length === 0) return rawValue;
        
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
        const links = parseLinks(processedValue);

        if(links.length === 0) return rawValue;
        
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
    selectDirectory,
    getFiles,
    saveFile,
    deleteFiles,
    getMediaFiles,
    uploadMediaFile,
    replacePublicLinks,
    replacePreviewLinks
};

export default local;
