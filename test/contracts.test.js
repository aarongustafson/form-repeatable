import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

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
