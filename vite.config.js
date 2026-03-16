import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), wasm(), nodePolyfills({ exclude: ['crypto', 'module'] })],
	resolve: {
		alias: {
			'node-fetch': '/src/lib/fetch-shim.js',
			'./libsodium-sumo.mjs': path.resolve('node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs'),
		}
	},
	ssr: {
		external: ['better-sqlite3'],
	},
	server: {
		allowedHosts: ['silver.boston-woodpecker.ts.net'],
	},
	build: {
		target: 'esnext'
	}
};

export default config;
