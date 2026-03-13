import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), wasm(), nodePolyfills()],
	resolve: {
		alias: {
			'node-fetch': '/src/lib/fetch-shim.js'
		}
	},
	optimizeDeps: {
		exclude: ['lucid-cardano']
	},
	build: {
		target: 'esnext'
	}
};

export default config;
