import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

describe('FormRepeatableElement', () => {
	let element;

	beforeEach(() => {
		// Register the custom element if not already registered
		if (!customElements.get('form-repeatable')) {
			customElements.define('form-repeatable', FormRepeatableElement);
		}

		element = document.createElement('form-repeatable');
		document.body.appendChild(element);
	});

	afterEach(() => {
		if (element && element.parentElement) {
			element.remove();
		}
	});

	describe('Basic functionality', () => {
		it('should be defined', () => {
			expect(customElements.get('form-repeatable')).toBe(
				FormRepeatableElement,
			);
		});

		it('should create an instance', () => {
			expect(element).toBeInstanceOf(FormRepeatableElement);
			expect(element).toBeInstanceOf(HTMLElement);
		});

		it('should have a shadow root', () => {
			expect(element.shadowRoot).toBeTruthy();
		});
	});

	describe('Attributes', () => {
		it('should handle removable attribute', () => {
			expect(element.removable).toBe(false);

			element.setAttribute('removable', '');
			expect(element.removable).toBe(true);

			element.removeAttribute('removable');
			expect(element.removable).toBe(false);
		});

		it('should use default add-label', () => {
			expect(element.addLabel).toBe('Add Another');
		});

		it('should use custom add-label', () => {
			element.setAttribute('add-label', 'Add More');
			expect(element.addLabel).toBe('Add More');
		});

		it('should use default remove-label', () => {
			expect(element.removeLabel).toBe('Remove');
		});

		it('should use custom remove-label', () => {
			element.setAttribute('remove-label', 'Delete');
			expect(element.removeLabel).toBe('Delete');
		});
	});

	describe('Buttons', () => {
		it('should show add button when not removable', () => {
			const addButton = element.shadowRoot.querySelector('.add');
			expect(addButton).toBeTruthy();
			expect(addButton.textContent).toBe('Add Another');
		});

		it('should show remove button when removable', () => {
			element.setAttribute('removable', '');
			const removeButton = element.shadowRoot.querySelector('.remove');
			expect(removeButton).toBeTruthy();
			expect(removeButton.textContent).toBe('Remove');
		});

		it('should not show add button when removable', () => {
			element.setAttribute('removable', '');
			const addButton = element.shadowRoot.querySelector('.add');
			expect(addButton).toBeFalsy();
		});

		it('should not show remove button when not removable', () => {
			const removeButton = element.shadowRoot.querySelector('.remove');
			expect(removeButton).toBeFalsy();
		});
	});

	describe('Adding fields', () => {
		it('should clone and append new element when add button is clicked', () => {
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			const initialCount =
				document.querySelectorAll('form-repeatable').length;

			addButton.click();

			const newCount =
				document.querySelectorAll('form-repeatable').length;
			expect(newCount).toBe(initialCount + 1);
		});

		it('should increment numeric values in labels', () => {
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			const allElements = document.querySelectorAll('form-repeatable');
			const newElement = allElements[allElements.length - 1];
			const newLabel = newElement.querySelector('label');

			expect(newLabel.textContent).toBe('Stop 2');
			expect(newLabel.getAttribute('for')).toBe('stop-2');
		});

		it('should increment input IDs', () => {
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			const allElements = document.querySelectorAll('form-repeatable');
			const newElement = allElements[allElements.length - 1];
			const newInput = newElement.querySelector('input');

			expect(newInput.getAttribute('id')).toBe('stop-2');
		});

		it('should clear input values in cloned element', () => {
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]" value="Test">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			const allElements = document.querySelectorAll('form-repeatable');
			const newElement = allElements[allElements.length - 1];
			const newInput = newElement.querySelector('input');

			expect(newInput.value).toBe('');
		});

		it('should make original element removable after adding', () => {
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			expect(element.hasAttribute('removable')).toBe(true);
			expect(element.shadowRoot.querySelector('.remove')).toBeTruthy();
		});

		it('should fire form-repeatable:added event', () => {
			const handler = vi.fn();
			element.addEventListener('form-repeatable:added', handler);

			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			expect(handler).toHaveBeenCalled();
			expect(handler.mock.calls[0][0].detail.original).toBe(element);
		});

		it('should handle multiple labels and inputs', () => {
			element.innerHTML = `
				<label for="start-1">Start 1</label>
				<input id="start-1" type="text" name="start-1">
				<label for="end-1">End 1</label>
				<input id="end-1" type="text" name="end-1">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			const allElements = document.querySelectorAll('form-repeatable');
			const newElement = allElements[allElements.length - 1];
			const labels = newElement.querySelectorAll('label');
			const inputs = newElement.querySelectorAll('input');

			expect(labels[0].textContent).toBe('Start 2');
			expect(labels[0].getAttribute('for')).toBe('start-2');
			expect(inputs[0].getAttribute('id')).toBe('start-2');

			expect(labels[1].textContent).toBe('End 2');
			expect(labels[1].getAttribute('for')).toBe('end-2');
			expect(inputs[1].getAttribute('id')).toBe('end-2');
		});
	});

	describe('Removing fields', () => {
		it('should remove element when remove button is clicked', async () => {
			element.setAttribute('removable', '');
			element.innerHTML = `
				<label for="stop-1">Stop 1</label>
				<input id="stop-1" type="text" name="stops[]">
			`;

			const removeButton = element.shadowRoot.querySelector('.remove');
			const parent = element.parentElement;

			removeButton.click();

			// Wait for next tick
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(parent.contains(element)).toBe(false);
		});

		it('should fire form-repeatable:removed event', () => {
			const handler = vi.fn();
			element.setAttribute('removable', '');

			// Need to add listener before setting up the element
			document.addEventListener('form-repeatable:removed', handler);

			const removeButton = element.shadowRoot.querySelector('.remove');
			removeButton.click();

			expect(handler).toHaveBeenCalled();
			expect(handler.mock.calls[0][0].detail.element).toBe(element);

			// Cleanup
			document.removeEventListener('form-repeatable:removed', handler);
		});
	});

	describe('Edge cases', () => {
		it('should handle labels without numbers', () => {
			element.innerHTML = `
				<label for="email">Email</label>
				<input id="email" type="email" name="email">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			// Should not throw
			expect(() => addButton.click()).not.toThrow();
		});

		it('should handle inputs without IDs', () => {
			element.innerHTML = `
				<label>Name</label>
				<input type="text" name="name">
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			// Should not throw
			expect(() => addButton.click()).not.toThrow();
		});

		it('should handle checkboxes', () => {
			element.innerHTML = `
				<label for="option-1">Option 1</label>
				<input id="option-1" type="checkbox" name="options[]" checked>
			`;

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			const allElements = document.querySelectorAll('form-repeatable');
			const newElement = allElements[allElements.length - 1];
			const newCheckbox = newElement.querySelector(
				'input[type="checkbox"]',
			);

			expect(newCheckbox.checked).toBe(false);
		});
	});
});
