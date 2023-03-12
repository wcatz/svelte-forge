import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

const config = {
	plugins: [sveltekit(), topLevelAwait(), wasm()],
	resolve: {
		alias: {
			'node-fetch': 'node-fetch-polyfill',
		},
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2020',
		},
		exclude: ['lucid-cardano'],
	},
	build: {
		target: 'es2020',
	},
};

export default config;
