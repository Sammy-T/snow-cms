import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

/** The terms used to separate vendor modules into separate chunks. */
const vendorModules = [
    '@milkdown', 'dayjs', 'js-yaml', 'micromark', 'pouchdb', 
    'prosemirror', 'svelte'
];

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    root: 'cms',
    plugins: [svelte()],
    resolve: {
        alias: {
            $assets: resolve('./cms/src/assets'),
            $lib: resolve('./cms/src/lib'),
            $stores: resolve('./cms/src/lib/stores'),
            $util: resolve('./cms/src/lib/util'),
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        modulePreload: false,
        // sourcemap: true,
        rollupOptions: {
            output: {
                entryFileNames: '[name].js',
                assetFileNames: '[name][extname]',
                chunkFileNames: '[name].js',
                manualChunks: function manualChunks(id) {
                    if (id.includes('node_modules')) {
                        let name = 'vendor';

                        vendorModules.forEach(module => {
                            if(id.includes(module)) name = `vendor-${module}`;
                        });

                        return name;
                    }
                }
            }
        }
    }
})
