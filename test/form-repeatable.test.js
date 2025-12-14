import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormRepeatableElement } from '../form-repeatable.js';

describe('FormRepeatableElement', () => {
	beforeEach(() => {
		if (!customElements.get('form-repeatable')) {
			customElements.define('form-repeatable', FormRepeatableElement);
		}
	});

	describe('Basic functionality', () => {
		it('should be defined', () => {
			expect(customElements.get('form-repeatable')).toBe(
				FormRepeatableElement,
			);
		});

		it('should create an instance', () => {
			const element = document.createElement('form-repeatable');
			expect(element).toBeInstanceOf(FormRepeatableElement);
			expect(element).toBeInstanceOf(HTMLElement);
		});

		it('should have a shadow root', () => {
			const element = document.createElement('form-repeatable');
			expect(element.shadowRoot).toBeTruthy();
		});

		it('should be form-associated', () => {
			expect(FormRepeatableElement.formAssociated).toBe(true);
		});
	});

	describe('Property reflection', () => {
		it('should reflect addLabel property to add-label attribute', () => {
			const element = document.createElement('form-repeatable');
			element.addLabel = 'Add Person';
			expect(element.getAttribute('add-label')).toBe('Add Person');
		});

		it('should reflect removeLabel property to remove-label attribute', () => {
			const element = document.createElement('form-repeatable');
			element.removeLabel = 'Delete';
			expect(element.getAttribute('remove-label')).toBe('Delete');
		});

		it('should reflect min property to min attribute', () => {
			const element = document.createElement('form-repeatable');
			element.min = 3;
			expect(element.getAttribute('min')).toBe('3');
		});

		it('should reflect max property to max attribute', () => {
			const element = document.createElement('form-repeatable');
			element.max = 4;
			expect(element.getAttribute('max')).toBe('4');
		});

		it('should upgrade properties set before definition', () => {
			const uniqueTag = `form-repeatable-upgrade-${Date.now()}-${Math.random()
				.toString(36)
				.slice(2)}`;
			const preUpgrade = document.createElement(uniqueTag);
			preUpgrade.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]">
				</div>
			`;
			preUpgrade.addLabel = 'Add Stop';
			document.body.appendChild(preUpgrade);

			class UpgradedElement extends FormRepeatableElement {}
			customElements.define(uniqueTag, UpgradedElement);

			expect(preUpgrade.addLabel).toBe('Add Stop');
			preUpgrade.remove();
		});
	});

	describe('Template extraction', () => {
		it('should use first child as template', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]">
				</div>
			`;
			document.body.appendChild(element);

			// Template should be extracted and templatized
			expect(element._template).toBeTruthy();
			expect(element._template.tagName).toBe('DIV');

			// Check that template has {n} placeholders
			const label = element._template.querySelector('label');
			expect(label.getAttribute('for')).toBe('stop-{n}');
			expect(label.textContent).toBe('Stop {n}');

			const input = element._template.querySelector('input');
			expect(input.id).toBe('stop-{n}');

			element.remove();
		});

		it('should use explicit template element', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<template>
					<div>
						<label for="email-{n}">Email {n}</label>
						<input id="email-{n}" name="emails[]" type="email">
					</div>
				</template>
			`;
			document.body.appendChild(element);

			expect(element._template).toBeTruthy();
			const label = element._template.querySelector('label');
			expect(label.getAttribute('for')).toBe('email-{n}');

			element.remove();
		});

		it('should support any container element', () => {
			const testCases = ['div', 'fieldset', 'p'];

			testCases.forEach((tag) => {
				const element = document.createElement('form-repeatable');
				element.innerHTML = `
					<${tag}>
						<input name="test[]">
					</${tag}>
				`;
				document.body.appendChild(element);

				expect(element._template.tagName).toBe(tag.toUpperCase());
				element.remove();
			});
		});
	});

	describe('Group initialization', () => {
		it('should initialize with one group from template', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]">
				</div>
			`;
			document.body.appendChild(element);

			expect(element._groups.length).toBe(1);
			const groups =
				element.shadowRoot.querySelectorAll('[part="group"]');
			expect(groups.length).toBe(1);

			element.remove();
		});

		it('should initialize with multiple pre-existing groups', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]" value="Seattle">
				</div>
				<div>
					<label for="stop-2">Stop 2</label>
					<input id="stop-2" name="stops[]" value="Portland">
				</div>
				<div>
					<label for="stop-3">Stop 3</label>
					<input id="stop-3" name="stops[]" value="SF">
				</div>
			`;
			document.body.appendChild(element);

			expect(element._groups.length).toBe(3);
			const groups =
				element.shadowRoot.querySelectorAll('[part="group"]');
			expect(groups.length).toBe(3);

			// Check values are preserved
			const inputs = element.shadowRoot.querySelectorAll('input');
			expect(inputs[0].value).toBe('Seattle');
			expect(inputs[1].value).toBe('Portland');
			expect(inputs[2].value).toBe('SF');

			element.remove();
		});
	});

	describe('Adding groups', () => {
		it('should add a new group when add button is clicked', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]">
				</div>
			`;
			document.body.appendChild(element);

			const addButton = element.shadowRoot.querySelector('.add');
			expect(addButton).toBeTruthy();

			addButton.click();

			expect(element._groups.length).toBe(2);
			const groups =
				element.shadowRoot.querySelectorAll('[part="group"]');
			expect(groups.length).toBe(2);

			// Check second group has incremented numbers
			const secondGroupInput = groups[1].querySelector('input');
			expect(secondGroupInput.id).toBe('stop-2');

			element.remove();
		});

		it('should fire form-repeatable:added event', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `<div><input name="test[]"></div>`;
			document.body.appendChild(element);

			const handler = vi.fn();
			element.addEventListener('form-repeatable:added', handler);

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			expect(handler).toHaveBeenCalled();
			expect(handler.mock.calls[0][0].detail.groupCount).toBe(2);

			element.remove();
		});

		it('should not add beyond max', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('max', '2');
			element.innerHTML = `<div><input name="test[]"></div>`;
			document.body.appendChild(element);

			const addButton = element.shadowRoot.querySelector('.add');
			addButton.click();

			expect(element._groups.length).toBe(2);

			// Add button should be hidden now
			const addButtonAfter = element.shadowRoot.querySelector('.add');
			expect(addButtonAfter).toBeFalsy();

			element.remove();
		});
	});

	describe('Removing groups', () => {
		it('should remove a group when remove button is clicked', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div><input name="test[]" value="1"></div>
				<div><input name="test[]" value="2"></div>
				<div><input name="test[]" value="3"></div>
			`;
			document.body.appendChild(element);

			expect(element._groups.length).toBe(3);

			const removeButtons =
				element.shadowRoot.querySelectorAll('.remove');
			removeButtons[1].click(); // Remove middle group

			expect(element._groups.length).toBe(2);

			element.remove();
		});

		it('should renumber groups after removal', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<label for="stop-1">Stop 1</label>
					<input id="stop-1" name="stops[]">
				</div>
				<div>
					<label for="stop-2">Stop 2</label>
					<input id="stop-2" name="stops[]">
				</div>
				<div>
					<label for="stop-3">Stop 3</label>
					<input id="stop-3" name="stops[]">
				</div>
			`;
			document.body.appendChild(element);

			const removeButtons =
				element.shadowRoot.querySelectorAll('.remove');
			removeButtons[1].click(); // Remove "Stop 2"

			const groups =
				element.shadowRoot.querySelectorAll('[part="group"]');
			const labels = Array.from(groups).map(
				(g) => g.querySelector('label').textContent,
			);
			expect(labels).toEqual(['Stop 1', 'Stop 2']); // Stop 3 renumbered to Stop 2

			element.remove();
		});

		it('should not remove below min', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('min', '2');
			element.innerHTML = `
				<div><input name="test[]"></div>
				<div><input name="test[]"></div>
			`;
			document.body.appendChild(element);

			expect(element._groups.length).toBe(2);

			// Remove buttons should be hidden
			const removeButtons =
				element.shadowRoot.querySelectorAll('.remove');
			expect(removeButtons.length).toBe(0);

			element.remove();
		});

		it('should fire form-repeatable:removed event', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div><input name="test[]"></div>
				<div><input name="test[]"></div>
			`;
			document.body.appendChild(element);

			const handler = vi.fn();
			element.addEventListener('form-repeatable:removed', handler);

			const removeButton = element.shadowRoot.querySelector('.remove');
			removeButton.click();

			expect(handler).toHaveBeenCalled();
			expect(handler.mock.calls[0][0].detail.groupCount).toBe(1);

			element.remove();
		});
	});

	describe('Min/Max attributes', () => {
		it('should default to min=1', () => {
			const element = document.createElement('form-repeatable');
			expect(element.min).toBe(1);
		});

		it('should accept valid min values', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('min', '3');
			expect(element.min).toBe(3);
		});

		it('should reject invalid min values', () => {
			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const element = document.createElement('form-repeatable');
			element.setAttribute('min', '0');
			expect(element.min).toBe(1);
			expect(spy).toHaveBeenCalled();

			spy.mockClear();
			element.setAttribute('min', '-1');
			expect(element.min).toBe(1);
			expect(spy).toHaveBeenCalled();

			spy.mockClear();
			element.setAttribute('min', '2.5');
			expect(element.min).toBe(1);
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});

		it('should default to max=null (unlimited)', () => {
			const element = document.createElement('form-repeatable');
			expect(element.max).toBe(null);
		});

		it('should accept valid max values', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('min', '1');
			element.setAttribute('max', '5');
			expect(element.max).toBe(5);
		});

		it('should reject max <= min', () => {
			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const element = document.createElement('form-repeatable');
			element.setAttribute('min', '3');
			element.setAttribute('max', '2');
			expect(element.max).toBe(null);
			expect(spy).toHaveBeenCalled();

			spy.mockRestore();
		});
	});

	describe('Form participation', () => {
		it('should update form value when inputs change', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<input name="stops[]" value="Seattle">
				</div>
			`;
			document.body.appendChild(element);

			const input = element.shadowRoot.querySelector('input');
			input.value = 'Portland';
			input.dispatchEvent(new Event('input', { bubbles: true }));

			// _updateFormValue should have been called
			// Note: We can't easily test _internals.formValue directly in tests

			element.remove();
		});

		it('should handle checkboxes correctly', () => {
			const element = document.createElement('form-repeatable');
			element.innerHTML = `
				<div>
					<input type="checkbox" name="options[]" value="opt1" checked>
				</div>
			`;
			document.body.appendChild(element);

			// Verify checkbox is in shadow DOM and checked state is preserved
			const checkbox = element.shadowRoot.querySelector(
				'input[type="checkbox"]',
			);
			expect(checkbox.checked).toBe(true);

			element.remove();
		});
	});

	describe('Attributes', () => {
		it('should use default add-label', () => {
			const element = document.createElement('form-repeatable');
			expect(element.addLabel).toBe('Add Another');
		});

		it('should use custom add-label', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('add-label', 'Add More');
			expect(element.addLabel).toBe('Add More');
		});

		it('should use default remove-label', () => {
			const element = document.createElement('form-repeatable');
			expect(element.removeLabel).toBe('Remove');
		});

		it('should use custom remove-label', () => {
			const element = document.createElement('form-repeatable');
			element.setAttribute('remove-label', 'Delete');
			expect(element.removeLabel).toBe('Delete');
		});
	});
});
