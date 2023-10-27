import { writable, readable, derived } from 'svelte/store';
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

export const cmsActions = derived(config, ($config, set) => {
    const file = $config?.custom_actions;
    if(!file) return null;

    loadCmsActions(file)
        .then(set)
        .catch(error => console.error('Failed to load cms actions.', error));

    return () => {};
});

async function loadConfig() {
    /**
     * I'm not sure why this path is different (`../` instead of `../../`)
     * but I'm guessing Vite handles it differently
     * because the url string argument is static instead of built at runtime.
     */
    const configUrl = new URL('../cms-config/config.yml', import.meta.url).href;

    const res = await fetch(configUrl);
    if(!res.ok) throw new Error(`Unable to fetch file ${configUrl}`);

    const loaded = yaml.load(await res.text());

    return loaded;
}

async function loadCmsActions(file) {
    const path = `../../cms-config/${file}`;
    const url = new URL(path, import.meta.url).href;

    const customActions = await import(url);

    return customActions.default;
}
