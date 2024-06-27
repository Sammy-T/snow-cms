import 'dotenv/config';
import { copyFile, readFile, writeFile } from 'fs/promises';

const lockfileName = 'cms-lock.json';
const lockfilePath = new URL(`../${lockfileName}`, import.meta.url);

async function readLockfile() {
    try {
        const contents = await readFile(lockfilePath, { encoding: 'utf8' });

        return JSON.parse(contents);
    } catch(error) {
        console.warn('No lockfile found.', error);
        return;
    }
}

async function copyConfig() {
    try {
        // Get the CMS env.
        // Fall back to 'prod' if not found.
        const cmsEnv = process.env.CMS_ENV ?? 'prod';

        // Check the custom lockfile
        const lock = await readLockfile();

        // If the lockfile matches the specified env, return early.
        if(lock?.cms_env === cmsEnv) {
            console.log('CMS lockfile matches.');
            return;
        }

        // The env and lockfile don't match 
        // so copy the specified config.
        const sourcePath = `scripts/.config/config-${cmsEnv}.yml`;
        const configPath = 'dev-site/cms-config/config.yml';

        await copyFile(sourcePath, configPath);
        console.log(`CMS env '${cmsEnv}'.\nCopied ${sourcePath} => ${configPath}`);

        // Update the lock data
        const newLock = { ...lock };
        newLock.cms_env = cmsEnv;

        const data = JSON.stringify(newLock, null, 2);

        // Update the lockfile
        await writeFile(lockfileName, data);
    } catch(error) {
        console.error('CMS copy config error', error);
    }
}

copyConfig();
