import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'server',
	adapter: cloudflare(),
	build: {
		assetsPrefix: 'https://cdn.example.com',
	},
});
