import { getContents } from "$lib/util";
import { base64ToBlob, getMimeTypeFromExt } from "../blob";
import { getRepoFileBlob } from "./request";
import yaml from 'js-yaml';

/**
 * Constructs a doc.
 * @param {String} collectionName 
 * @param {String} folder 
 * @param {*} entry 
 */
export function constructDocFromGitHub(collectionName, folder, entry) {
    const { id, text } = entry.object;

    const [frontMatter, body] = getContents(text);
    const fields = yaml.load(frontMatter);

    const doc = {
        _id: id,
        name: entry.name,
        collection: collectionName,
        path: folder,
        date: fields['date'],
        raw: text,
        fields,
        body
    };

    return doc;
}

/**
 * Constructs an asset doc.
 * @param {import('@octokit/core').Octokit} octokit 
 * @param {*} cfg - The config object
 * @param {String} mediaFolder 
 * @param {String} publicFolder 
 * @param {*} entry  
 */
export async function constructAssetDocFromGitHub(octokit, cfg, mediaFolder, publicFolder, entry) {
    const [ owner, repoName ] = cfg.backend.repo.split('/');

    const { id, oid } = entry.object;

    const resp = await getRepoFileBlob(octokit, owner, repoName, oid);

    const url = `${publicFolder}/${entry.name}`;
    let urlPreview = url;

    if(resp.status === 200) {
        try {
            const { content, encoding } = resp.data;
            const type = getMimeTypeFromExt(entry.extension);

            const blob = await base64ToBlob(type, encoding, content);

            urlPreview = URL.createObjectURL(blob);
        } catch(error) {
            console.error('Error creating preview url.', error);
        }
    }

    const doc = {
        _id: id,
        name: entry.name,
        path: mediaFolder,
        url,
        url_preview: urlPreview
    };

    return doc;
}
