import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, it } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

it('trims block-edge margins inside demo sections', () => {
	const styles = read('../demo/demo-shell.css');
	expect(styles).toMatch(
		/\.demo-section(?:,\s*\.api-reference)?\s*\{[^}]*\bmargin-trim:\s*block;/,
	);
});

for (const file of ['index.html', 'esm.html', 'unpkg.html']) {
	it(`${file}: every authored example has a unique fragment destination`, async () => {
		const window = new Window({
			settings: {
				disableCSSFileLoading: true,
				disableJavaScriptFileLoading: true,
				disableJavaScriptEvaluation: true,
				handleDisabledFileLoadingAsSuccess: true,
			},
		});
		const page = new window.DOMParser().parseFromString(
			read(`../demo/${file}`),
			'text/html',
		);
		const ids = [...page.querySelectorAll('[id]')].map(
			(element) => element.id,
		);
		expect(new Set(ids).size).toBe(ids.length);
		const examples = [...page.querySelectorAll('.demo-section')];
		expect(examples.length).toBeGreaterThan(0);
		for (const example of examples) {
			expect(example.id).toMatch(/^[a-z]+(?:-[a-z]+)+$/);
			expect(example.querySelector('h2, h3')).not.toBeNull();
			expect(example.querySelector('.code-demo-pair')).not.toBeNull();
			expect(page.getElementById(example.id)).toBe(example);
		}
		for (const pair of page.querySelectorAll('.code-demo-pair')) {
			expect(pair.closest('.demo-section')).not.toBeNull();
		}
		await window.happyDOM.abort();
	});
}

it('publishes the documented attributes, CSS parts, events and registration helper', () => {
	const manifest = JSON.parse(read('../custom-elements.json'));
	expect(manifest.readme).toBe('README.md');
	const component = manifest.modules.find(
		(entry) => entry.path === 'form-repeatable.js',
	).declarations[0];
	expect(component.attributes.map((entry) => entry.name)).toEqual(
		FormRepeatableElement.observedAttributes,
	);
	const docs = read('../README.md');
	const source = read('../form-repeatable.js');
	const parts = [...source.matchAll(/@csspart ([\w-]+)/g)].map(
		(match) => match[1],
	);
	expect(component.cssParts.map((entry) => entry.name)).toEqual(parts);
	for (const part of parts) expect(docs).toContain(`\`${part}\``);
	expect(component.events.map((entry) => entry.name)).toEqual([
		'form-repeatable:added',
		'form-repeatable:removed',
	]);
	for (const property of [
		'addLabel',
		'removeLabel',
		'min',
		'max',
		'resetGlobalStyles',
	]) {
		expect(component.members.map((entry) => entry.name)).toContain(
			property,
		);
		expect(read('../form-repeatable.d.ts')).toContain(property);
	}
	const definition = manifest.modules.find(
		(entry) => entry.path === 'define.js',
	);
	expect(definition.exports.map((entry) => entry.name)).toEqual([
		'defineFormRepeatable',
	]);
	expect(read('../define.d.ts')).toContain('defineFormRepeatable');
});
