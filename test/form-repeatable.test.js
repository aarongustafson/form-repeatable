import { describe, it, expect, beforeEach } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

describe('FormRepeatableElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('form-repeatable');
		document.body.appendChild(element);
	});

	it('should be defined', () => {
		expect(customElements.get('form-repeatable')).toBe(FormRepeatableElement);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(FormRepeatableElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	// Add more tests here
});
