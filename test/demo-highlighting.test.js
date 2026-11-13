import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const name = 'form-repeatable';
const hashes = {
	'esm.html':
		'3ce7475f6b330e6bda0f3bd4baf40c1f1d2f3be2efeb868e2332fb8d4bdddf93',
	'index.html':
		'37022dd1137c6afdf9c4497dbc5a8e3bd81e93adacd9250d82f621c3f5c77934',
	'unpkg.html':
		'cb395b0b1dc538866360a8df8366555b3e3e268034d4df19852c70c5fd16bdd1',
};

function normalizedCode(file, text) {
	if (file !== 'esm.html') return text;
	return text.replace(
		new RegExp(
			'(https://esm[.]sh/@aarongustafson/form-repeatable@)[0-9]+[.][0-9]+[.][0-9]+(?:-[0-9A-Za-z.-]+)?(?:[+][0-9A-Za-z.-]+)?(?=/)',
			'g',
		),
		'$1<version>',
	);
}

function verifyDemo(source, file) {
	const template = document.createElement('template');
	template.innerHTML = source;
	const blocks = [...template.content.querySelectorAll('pre code')];
	const text = blocks.map((code) => code.textContent).join('\n');
	expect(
		createHash('sha256').update(normalizedCode(file, text)).digest('hex'),
	).toBe(hashes[file]);
	expect(template.content.querySelector('mark mark')).toBeNull();
	for (const code of blocks) {
		const marks = [...code.querySelectorAll('mark')].map(
			(mark) => mark.textContent,
		);
		const snippets = [
			...code.textContent.matchAll(
				new RegExp(`<\\/?${name}\\b[^>]*>`, 'g'),
			),
			...code.textContent.matchAll(/import\s[\s\S]*?;/g),
			...code.textContent.matchAll(
				/(?:customElements\.(?:get|define)\([\s\S]*?\)|define[A-Z]\w*\(\))/g,
			),
		];
		for (const [snippet] of snippets) {
			expect(
				marks.some((mark) => mark.includes(snippet)),
				`${file}: ${snippet}`,
			).toBe(true);
		}
	}
}

describe('displayed component code', () => {
	for (const file of Object.keys(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			verifyDemo(readFileSync(`demo/${file}`, 'utf8'), file);
		});
	}

	it('allows the publishing helper to update CDN versions without changing other displayed code', () => {
		const fixture = `test/.demo-highlighting-release-${randomUUID()}`;
		mkdirSync(`${fixture}/scripts`, { recursive: true });
		mkdirSync(`${fixture}/demo`);
		try {
			writeFileSync(
				`${fixture}/package.json`,
				JSON.stringify({
					name: `@aarongustafson/${name}`,
					type: 'module',
					version: '9.8.7',
				}),
			);
			writeFileSync(
				`${fixture}/scripts/update-demo-versions.js`,
				readFileSync('scripts/update-demo-versions.js'),
			);
			writeFileSync(
				`${fixture}/demo/esm.html`,
				readFileSync('demo/esm.html'),
			);
			execFileSync(process.execPath, [
				`${fixture}/scripts/update-demo-versions.js`,
			]);
			const updated = readFileSync(`${fixture}/demo/esm.html`, 'utf8');
			expect(updated).toContain(`@aarongustafson/${name}@9.8.7/`);
			verifyDemo(updated, 'esm.html');
			expect(() =>
				verifyDemo(
					updated.replace(/(<pre[^>]*><code[^>]*>)/, '$1changed'),
					'esm.html',
				),
			).toThrow();
			const url = `https://esm.sh/@aarongustafson/${name}@9.8.7/define.js`;
			expect(normalizedCode('esm.html', url)).toBe(
				url.replace('@9.8.7/', '@<version>/'),
			);
			expect(normalizedCode('unpkg.html', url)).toBe(url);
			expect(
				normalizedCode(
					'esm.html',
					url.replace('esm.sh', 'other.invalid'),
				),
			).toBe(url.replace('esm.sh', 'other.invalid'));
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});
});
