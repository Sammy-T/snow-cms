import { getContents } from '$lib/util';
import yaml from 'js-yaml';

/**
 * Constructs a PouchDB compatible doc.
 * @param {String} collectionName 
 * @param {import('browser-fs-access').FileWithDirectoryAndFileHandle} file
 */
export async function constructDocFromFile(collectionName, file) {
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
 * @param {*} cfg - The config object
 * @param {import('browser-fs-access').FileWithDirectoryAndFileHandle} file
 */
export function constructAssetDocFromFile(cfg, file) {
    // @ts-ignore
    const date = file.lastModifiedDate;

    const url = `${cfg.public_folder}/${file.name}`;

    const doc = {
        _id: file.webkitRelativePath,
        name: file.name,
        date,
        asset: file.type,
        url,
        url_preview: url,
        handle: file.handle,
        directoryHandle: file.directoryHandle
    };

    return doc;
}
