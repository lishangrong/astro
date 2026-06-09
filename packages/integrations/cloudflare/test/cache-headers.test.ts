import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import { fileURLToPath } from 'node:url';

describe('cache headers — default (no existing _headers)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-headers-default/',
		});
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('creates _headers with Cache-Control rule for _astro/*', async () => {
		assert.ok(
			fixture.pathExists('client/_headers'),
			'_headers file should be created in client directory',
		);
		const content = await fixture.readFile('client/_headers');
		assert.match(
			content,
			/^\/_astro\/\*/m,
			'_headers should contain a rule for /_astro/*',
		);
		assert.match(
			content,
			/Cache-Control:\s*public,\s*max-age=31536000,\s*immutable/,
			'_headers should contain the immutable Cache-Control header',
		);
	});
});

describe('cache headers — skip when user has Cache-Control for _astro/*', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-headers-skip-user/',
		});
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('does not duplicate Cache-Control rule when user already defines one', async () => {
		const content = await fixture.readFile('client/_headers');
		// The user's max-age=604800 should be present
		assert.match(content, /max-age=604800/, 'User-defined Cache-Control must be preserved');
		// The adapter's max-age=31536000 should NOT be injected
		assert.doesNotMatch(
			content,
			/max-age=31536000/,
			'Adapter must not add a second Cache-Control rule when user already defines one for _astro/*',
		);
		// The user's custom header must also still be present
		assert.match(content, /X-Custom-Header:\s*42/, 'User-defined headers must be preserved');
	});
});

describe('cache headers — skip when assetsPrefix (CDN) is set', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-headers-skip-cdn/',
		});
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('does not inject Cache-Control rule when assetsPrefix is configured', async () => {
		// When assets are served from an external CDN, the adapter should not
		// create or modify the _headers file for cache-control purposes.
		if (fixture.pathExists('client/_headers')) {
			const content = await fixture.readFile('client/_headers');
			assert.doesNotMatch(
				content,
				/max-age=31536000/,
				'Adapter must not add Cache-Control rule when assetsPrefix is set',
			);
		}
		// If _headers doesn't exist at all, that's also correct — nothing to assert.
	});
});
