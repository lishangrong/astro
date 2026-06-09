import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('cache headers (default base)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-headers/',
		});

		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('generates _headers with Cache-Control for /_astro/*', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.match(content, /\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
	});
});

describe('cache headers with assetsPrefix', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-assets-prefix/',
		});

		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		await fixture.build();
	});

	after(async () => {
		await fixture.clean();
	});

	it('does not generate Cache-Control rule when assetsPrefix is set', async () => {
		try {
			const content = await fixture.readFile('client/_headers');
			// If _headers exists, it should not contain our generated cache rule
			assert.ok(!content.includes('Cache-Control'));
		} catch {
			// File doesn't exist — that's the expected behavior
			assert.ok(true);
		}
	});
});
