import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

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
            }
        }
    }
})
