import { get } from 'svelte/store';
import { fileOpen } from 'browser-fs-access';
import yaml from 'js-yaml';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const configPath = '../../cms-config/';

const mdParseErrMsg = `Unable to parse markdown entry. Backend must implement 'replacePreviewLinks()' 
    and return a valid string.`;

/**
 * Converts the provided `Date` to a string format compatible with HTML `<input>` element values.
 * @param {String} type - The format/input type ('datetime-local', 'date', or 'time')
 * @param {Date} d - The Date to format
 * @returns 
 */
export function formatDateTimeValue(type, d) {
    let datetime = dayjs(d);

    let formatted = '';

    switch(type) {
        case 'datetime-local':
            formatted = datetime.format('YYYY-MM-DDTHH:mm');
            break;
        
        case 'date':
            formatted = datetime.format('YYYY-MM-DD');
            break;
        
        case 'time':
            formatted = datetime.format('HH:mm');
            break;
    }

    return formatted;
}

/**
 * Retrieves the matching styles as specified in the config.
 * @param {*} config - The cms config
 * @param {String} name - The style name
 * @returns A string containing HTML link tags to the corresponding styles
 */
export function getStyles(config, name) {
    const files = config?.previews.styles.find(style => style.name === name)?.files;
    if(!files) return;

    const urls = [];
    
    files.forEach((path) => {
        const filepath = `${configPath}${path}`;
        urls.push(new URL(filepath, window.location.href).href);
    });

    return urls.map(url => `<link rel="stylesheet" href="${url}">`).join('\n');
}

/**
 * Loads the matching template file as specified in the config.
 * @param {*} config - The cms config
 * @param {String} name - The template name
 * @returns 
 */
export async function loadTemplate(config, name) {
    const template = config?.previews.templates.find(template => template.name === name)?.template;
    if(!template) return;

    const url = new URL(`${configPath}${template}`, window.location.href).href;

    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Unable to fetch file ${url}`);

        return await res.text();
    } catch(error) {
        console.error(error);
        return;
    }
}

/**
 * Replaces the tags found in the provided template with HTML link tags containing the styles
 * and div tags with `data-tag="fieldname"` attributes.
 * @param {String} template 
 * @param {String} styles 
 * @returns 
 */
export function replaceTags(template, styles) {
    return template?.replace('{{styles}}', styles)
        .replaceAll('{{', '<div data-tag="')
        .replaceAll('}}', '" style="white-space: pre-wrap;"></div>');
}

/**
 * Parses the provided value into a variable corresponding to the widget type.
 * @param {*} field 
 * @param {*} value 
 * @param {*} backend 
 */
export async function parseFormEntry(field, value, backend) {
    let entryValue;

    switch(field.widget) {
        case 'markdown':
            if(!backend?.replacePreviewLinks) throw new Error(mdParseErrMsg);
            
            entryValue = await backend?.replacePreviewLinks(value);
                
            if(entryValue == null) throw new Error(mdParseErrMsg);
            break;

        case 'datetime':
            let dateISO;
            
            switch(field.type) {
                case 'time':
                    dateISO = dayjs(value.toString(), 'hh:mm').toISOString();
                    break;
                
                case 'date':
                    dateISO = dayjs(value.toString(), 'YYYY-MM-DD').toISOString();
                    break;
                
                default:
                    dateISO = dayjs(value.toString(), 'YYYY-MM-DDThh:mm').toISOString();
                    break;
            }
            
            entryValue = new Date(dateISO);
            break;
        
        case 'boolean':
            entryValue = value === 'true';
            break;
        
        case 'number':
            entryValue = Number(value);
            break;

        case 'hidden':
            switch(field.type) {
                case 'datetime-local':
                    entryValue = new Date(dayjs(value.toString(), 'YYYY-MM-DDThh:mm').toISOString());
                    break;

                case 'time':
                    entryValue = new Date(dayjs(value.toString(), 'hh:mm').toISOString());
                    break;
                
                case 'date':
                    entryValue = new Date(dayjs(value.toString(), 'YYYY-MM-DD').toISOString());
                    break;

                case 'boolean':
                    entryValue = value === 'true';
                    break;
                
                case 'number':
                    entryValue = Number(value);
                    break;

                default:
                    entryValue = value;
                    break;
            }
            break;
        
        default:
            entryValue = value; 
            break;
    }

    return entryValue;
}

/**
 * Formats a filename based on the collection's 'slug' template.
 * @param {*} collection 
 * @param {*} docFields 
 */
export function createFilename(collection, docFields) {
    const { slug, extension } = collection;
    const { title, date } = docFields;

    const safeTitle = title.toLowerCase().replaceAll(/\W+/g, '-');
    const parsedDate = dayjs(date);

    const name = slug.replaceAll('{{slug}}', safeTitle)
        .replaceAll('{{year}}', parsedDate.format('YYYY'))
        .replaceAll('{{month}}', parsedDate.format('MM'))
        .replaceAll('{{day}}', parsedDate.format('DD'))
        .replaceAll('{{hour}}', parsedDate.format('HH'))
        .replaceAll('{{minute}}', parsedDate.format('mm'))
        .replaceAll('{{second}}', parsedDate.format('ss'));
    
    return `${name}.${extension}`;
}

/**
 * Constructs a doc with the required properties.
 * @param {*} collection 
 * @param {*} entryData 
 */
export function constructDoc(collection, entryData) {
    const doc = { ...entryData }; // Copy the entry data

    // @ts-ignore
    const { date, body } = { ...doc.fields };
    delete doc.fields.body; // Remove the body from the fields data

    const frontMatter = yaml.dump(doc.fields, { quotingType: `"`, forceQuotes: true });

    doc.date = date;
    doc.body = body;
    doc.collection = collection.name;

    if(!doc.name) doc.name = createFilename(collection, doc.fields);

    doc.raw = `---\n${frontMatter}---\n\n${doc.body}`;

    return doc;
}

/**
 * Finds the MIME type corresponding to the provided extension.
 * @param {String} ext - The extension ex: '.ext'
 * @returns {String} The MIME type
 */
export function parseFileType(ext) {
    switch(ext) {
        case '.md':
        case '.markdown':
            return 'text/markdown';
        
        default:
            return 'text/plain';
    }
}

/**
 * Parses the link urls from the provided text.
 * @param {String} text 
 */
export function parseLinks(text) {
    const linkOrImgRE = /!?\[.+\]\(.+\)/g;
    const tagStartRE = /!?\[.+\]\(/;
    const tagEndRE = /\)/;
    
    const links = text.match(linkOrImgRE)?.map(match => {
        return match.replace(tagStartRE, '').replace(tagEndRE, '');
    });

    return links || [];
}

/**
 * Loads the custom backend script specified in the config file.
 * @param {import('svelte/store').Readable} configStore
 * @param {import('svelte/store').Writable} backendStore
 */
export async function loadCustomBackend(configStore, backendStore) {
    const { file } = get(configStore).backend;
    if(!file) return;

    const url = new URL(`${configPath}${file}`, window.location.href).href;

    
    const customBackend = await import(/* @vite-ignore */ url);

    const cfg = {
        configStore,
        backendStore,
        getStoreValueFunc: get,
        parseLinksFunc: parseLinks,
        fileOpenFunc: fileOpen
    };

    customBackend.default.init(cfg);
}
