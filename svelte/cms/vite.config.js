import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    root: 'svelte/cms',
    plugins: [svelte()],
    resolve: {
        alias: {
            $assets: resolve('./svelte/cms/src/assets'),
            $lib: resolve('./svelte/cms/src/lib'),
            $stores: resolve('./svelte/cms/src/lib/stores'),
            $util: resolve('./svelte/cms/src/lib/util'),
        }
    },
    build: {
        outDir: '../../site/static/cms/',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: function manualChunks(id) {
                    if (id.includes('node_modules')) {
                        let name = 'vendor';

                        [
                            '@milkdown', 'dayjs', 'js-yaml', 'micromark', 'pouchdb', 
                            'prosemirror', 'svelte'
                        ].forEach(module => {
                            if(id.includes(module)) name = `vendor-${module}`;
                        });

                        return name;
                    }
                }
            }
        }
    }
})
