import { writable, readable } from 'svelte/store';
import yaml from 'js-yaml';

export const selectedCollection = writable();
export const editingEntry = writable();
export const draftEntry = writable({});

export const backend = writable();

export const config = readable(null, set => {
    loadConfig()
        .then(set)
        .catch(error => console.error('Failed to load config.', error));
    
    return () => {};
});

async function loadConfig() {
    const configUrl = new URL('../cms-config/config.yml', import.meta.url).href;

    const res = await fetch(configUrl);
    if(!res.ok) throw new Error(`Unable to fetch file ${configUrl}`);

    const loaded = yaml.load(await res.text());

    return loaded;
}
