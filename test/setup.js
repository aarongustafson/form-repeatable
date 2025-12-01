import { beforeAll } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

// Mock ElementInternals for testing environment
beforeAll(() => {
	// Mock attachInternals for Happy-DOM (doesn't support it natively)
	if (!HTMLElement.prototype.attachInternals) {
		HTMLElement.prototype.attachInternals = function () {
			return {
				setFormValue: () => {},
				setValidity: () => {},
				checkValidity: () => true,
				reportValidity: () => true,
				validationMessage: '',
				validity: {
					valid: true,
				},
				willValidate: true,
				form: null,
				labels: [],
			};
		};
	}

	if (!customElements.get('form-repeatable')) {
		customElements.define('form-repeatable', FormRepeatableElement);
	}

	// Make the class available globally for testing static methods
	globalThis.FormRepeatableElement = FormRepeatableElement;
});
