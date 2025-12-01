/**
 * FormRepeatableElement - A web component that enables you to control the duplication of fields.
 * Ported from jQuery Repeatable Fields plugin
 *
 * @element form-repeatable
 *
 * @attr {boolean} removable - Marks this instance as removable
 * @attr {string} add-label - Custom label for the "Add" button (default: "Add Another")
 * @attr {string} remove-label - Custom label for the "Remove" button (default: "Remove")
 *
 * @fires form-repeatable:added - Fired when a new repeatable field is added
 * @fires form-repeatable:removed - Fired when a repeatable field is removed
 *
 * @slot - Default slot for the repeatable content
 *
 * @csspart content - The container for the slotted content
 * @csspart button - Both buttons (use ::part(button) to style all buttons)
 * @csspart add-button - The "Add Another" button (use ::part(button add-button) for specific styling)
 * @csspart remove-button - The "Remove" button (use ::part(button remove-button) for specific styling)
 * @csspart controls - The container for control buttons
 */
export class FormRepeatableElement extends HTMLElement {
	static get observedAttributes() {
		return ['removable', 'add-label', 'remove-label'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._countRegex = /(.*)(\d+)(.*)/;
		this._handleAdd = this._handleAdd.bind(this);
		this._handleRemove = this._handleRemove.bind(this);
		this._isRTL = null; // Cache for directionality
	}

	connectedCallback() {
		this.render();
		this._setupEventListeners();
	}

	disconnectedCallback() {
		this._cleanupEventListeners();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.render();
			this._setupEventListeners();
		}
	}

	get removable() {
		return this.hasAttribute('removable');
	}

	set removable(value) {
		if (value) {
			this.setAttribute('removable', '');
		} else {
			this.removeAttribute('removable');
		}
	}

	get addLabel() {
		return this.getAttribute('add-label') || 'Add Another';
	}

	get removeLabel() {
		return this.getAttribute('remove-label') || 'Remove';
	}

	_setupEventListeners() {
		const addButton = this.shadowRoot.querySelector('.add');
		const removeButton = this.shadowRoot.querySelector('.remove');

		if (addButton) {
			addButton.addEventListener('click', this._handleAdd);
		}
		if (removeButton) {
			removeButton.addEventListener('click', this._handleRemove);
		}
	}

	_cleanupEventListeners() {
		const addButton = this.shadowRoot.querySelector('.add');
		const removeButton = this.shadowRoot.querySelector('.remove');

		if (addButton) {
			addButton.removeEventListener('click', this._handleAdd);
		}
		if (removeButton) {
			removeButton.removeEventListener('click', this._handleRemove);
		}
	}

	_handleRemove(e) {
		e.preventDefault();

		// Find the next sibling form-repeatable to move focus to
		const nextSibling = this.nextElementSibling;
		let nextInput = null;

		if (nextSibling && nextSibling.tagName === 'FORM-REPEATABLE') {
			// Find the first input, select, or textarea in the next sibling
			nextInput = nextSibling.querySelector('input, select, textarea');
		}

		// Dispatch removal event
		this.dispatchEvent(
			new CustomEvent('form-repeatable:removed', {
				bubbles: true,
				composed: true,
				detail: { element: this },
			}),
		);

		this.remove();

		// Move focus to the next input if found
		if (nextInput) {
			nextInput.focus();
		}
	}

	_handleAdd(e) {
		e.preventDefault();

		// Get the parent container
		const container = this.parentElement;
		if (!container) return;

		// Get all labels in the current element
		const labels = this.querySelectorAll('label');

		// Create a clone
		const clone = this.cloneNode(true);

		// Update the current element
		this.removeAttribute('data-repeatable');
		this.setAttribute('removable', '');
		this.render();
		this._setupEventListeners();

		// Update clone labels and associated inputs
		const cloneLabels = clone.querySelectorAll('label');
		labels.forEach((label, i) => {
			const forAttr = label.getAttribute('for');
			if (!forAttr) return;

			const forBits = forAttr.match(this._countRegex);
			if (!forBits) return;

			const forIncrement = parseInt(forBits[2], 10) + 1;
			const labelText = label.textContent;
			const labelBits = labelText.match(this._countRegex);

			if (labelBits) {
				const labelIncrement = parseInt(labelBits[2], 10) + 1;
				const newLabelText =
					labelBits[1] + labelIncrement + labelBits[3];
				const newFor = forBits[1] + forIncrement + forBits[3];

				// Update clone's label
				if (cloneLabels[i]) {
					cloneLabels[i].textContent = newLabelText;
					cloneLabels[i].setAttribute('for', newFor);
				}

				// Update associated input/select/textarea in clone
				const associatedInput = clone.querySelector(`#${forAttr}`);
				if (associatedInput) {
					associatedInput.setAttribute('id', newFor);
					// Also update name if it follows the same pattern
					const nameAttr = associatedInput.getAttribute('name');
					if (nameAttr && !nameAttr.includes('[]')) {
						const nameBits = nameAttr.match(this._countRegex);
						if (nameBits) {
							const nameIncrement = parseInt(nameBits[2], 10) + 1;
							associatedInput.setAttribute(
								'name',
								nameBits[1] + nameIncrement + nameBits[3],
							);
						}
					}
					// Clear the value for the new field
					if (associatedInput.value) {
						associatedInput.value = '';
					}
					if (associatedInput.checked !== undefined) {
						associatedInput.checked = false;
					}
				}
			}
		});

		// Append the clone to the container
		container.appendChild(clone);

		// Dispatch added event
		this.dispatchEvent(
			new CustomEvent('form-repeatable:added', {
				bubbles: true,
				composed: true,
				detail: {
					original: this,
					clone: clone,
				},
			}),
		);
	}

	_getDirectionality() {
		// Return cached value if available
		if (this._isRTL !== null) {
			return this._isRTL;
		}

		// Check writing mode and direction to determine label order
		const writingMode = getComputedStyle(this).writingMode;
		const computedDir = getComputedStyle(this).direction;

		// Also check for explicit dir attribute on this or ancestor elements
		let dirAttr = this.getAttribute('dir');
		if (!dirAttr) {
			let ancestor = this.parentElement;
			while (ancestor && !dirAttr) {
				dirAttr = ancestor.getAttribute('dir');
				ancestor = ancestor.parentElement;
			}
		}

		// Cache and return the result
		this._isRTL =
			writingMode.includes('rl') ||
			computedDir === 'rtl' ||
			dirAttr === 'rtl';

		return this._isRTL;
	}

	render() {
		const showAdd = !this.removable;
		const showRemove = this.removable;

		// Get accessible name for remove button
		let removeAriaLabel = this.removeLabel;
		if (showRemove) {
			const firstLabel = this.querySelector('label');
			if (firstLabel) {
				const labelText = firstLabel.textContent.trim();
				// Always use action + object order for semantic clarity
				removeAriaLabel = `${this.removeLabel} ${labelText}`;
			}
		}

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: grid;
					grid-template-columns: minmax(min-content, 2fr) minmax(min-content, 1fr);
					gap: 1rem;
					align-items: end;
				}

				.slot-container {
					display: block;
				}

				.controls {
					display: block;
					align-self: inline-start;
				}

				button {
					white-space: nowrap;
				}
			</style>
			<div part="content" class="slot-container">
				<slot></slot>
			</div>
			<div part="controls" class="controls">
				${showAdd ? `<button part="button add-button" class="add" type="button">${this.addLabel}</button>` : ''}
				${showRemove ? `<button part="button remove-button" class="remove" type="button" aria-label="${removeAriaLabel}">${this.removeLabel}</button>` : ''}
			</div>
		`;
	}
}
