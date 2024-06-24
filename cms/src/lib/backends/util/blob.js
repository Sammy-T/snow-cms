/**
 * Creates a blob from a base64 string.
 * @param {String} mimeType
 * @param {String} encoding
 * @param {String} content - The base64 string
 */
export async function base64ToBlob(mimeType, encoding, content) {
    const dataResp = await fetch(`data:${mimeType};${encoding},${content}`);

    return dataResp.blob();
}

/**
 * Creates a base64 string from the provided file.
 * @param {File} file 
 * @param {Boolean} removePrefix - Whether to remove the prefix. `data:[<mediatype>][;base64],`
 * @returns {Promise<String>}
 */
export function fileToBase64(file, removePrefix = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = (error) => reject(error);

        reader.onload = () => {
            const { result } = reader;

            // @ts-ignore
            const base64Str = (removePrefix) ? result.replace(/^data:.+\/.+;base64,/, '') : result;

            resolve(base64Str);
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Determines the MIME type corresponding to the extension.
 * 
 * **Note:** Only supports image extensions.
 * @param {String} extension - The file extension (with or without leading `.`) 
 * @returns The MIME type ex. `image/jpeg`
 */
export function getMimeTypeFromExt(extension) {
    const ext = extension.replace('^.', '');

    let type;

    switch(ext) {
        case 'apng':
        case 'avif':
        case 'bmp':
        case 'gif':
        case 'jpeg':
        case 'png':
        case 'tiff':
        case 'webp':
            type = `image/${ext}`;
            break;
        
        case 'ico':
            type = 'image/vnd.microsoft.icon';
            break;
        
        case 'jpg':
            type = 'image/jpeg';
            break;
        
        case 'svg':
            type = 'image/svg+xml';
            break;

        case 'tif':
            type = 'image/tiff';
            break;
        
        default:
            type = 'application/octet-stream';
    }

    return type;
}
