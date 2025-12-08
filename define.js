import { FormRepeatableElement } from './form-repeatable.js';

export function defineFormRepeatable(tagName = 'form-repeatable') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FormRepeatableElement);
	}

	return true;
}

defineFormRepeatable();
