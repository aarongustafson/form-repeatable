import { beforeAll } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('form-repeatable')) {
		customElements.define('form-repeatable', FormRepeatableElement);
	}

	// Make the class available globally for testing static methods
	globalThis.FormRepeatableElement = FormRepeatableElement;
});
