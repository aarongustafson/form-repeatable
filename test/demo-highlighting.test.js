import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const name = 'form-repeatable';
const hashes = {
	'esm.html':
		'90ffdce676e88a9c65712486f2303e4ddef619c4c92360b2db388c2387310d54',
	'index.html':
		'37022dd1137c6afdf9c4497dbc5a8e3bd81e93adacd9250d82f621c3f5c77934',
	'unpkg.html':
		'cb395b0b1dc538866360a8df8366555b3e3e268034d4df19852c70c5fd16bdd1',
};

describe('displayed component code', () => {
	for (const [file, hash] of Object.entries(hashes)) {
		it(`highlights component snippets without changing code in ${file}`, () => {
			const template = document.createElement('template');
			template.innerHTML = readFileSync(`demo/${file}`, 'utf8');
			const blocks = [...template.content.querySelectorAll('pre code')];
			const text = blocks.map((code) => code.textContent).join('\n');
			expect(createHash('sha256').update(text).digest('hex')).toBe(hash);
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
		});
	}
});
