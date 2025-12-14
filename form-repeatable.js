/**
 * FormRepeatableElement - A web component that enables you to control the duplication of fields.
 * Single-instance component that manages repeatable field groups internally.
 *
 * @element form-repeatable
 *
 * @attr {string} add-label - Custom label for the "Add" button (default: "Add Another")
 * @attr {string} remove-label - Custom label for the "Remove" button (default: "Remove")
 * @attr {number} min - Minimum number of repeatable fields (default: 1, must be > 0)
 * @attr {number} max - Maximum number of repeatable fields (optional, must be > min)
 *
 * @fires form-repeatable:added - Fired when a new group is added
 * @fires form-repeatable:removed - Fired when a group is removed
 *
 * @csspart groups - Container for all field groups (default: CSS grid with 2-column layout)
 * @csspart group - Container for each field group and its controls (default: subgrid spanning both columns)
 * @csspart content - The container for the group's fields (default: column 1)
 * @csspart group-controls - The container for group-level control buttons (default: column 2, remove button)
 * @csspart controls - The container for field-level control buttons (default: add button below groups)
 * @csspart button - Both buttons (use ::part(button) to style all buttons)
 * @csspart add-button - The "Add Another" button
 * @csspart remove-button - The "Remove" button
 *
 * Default Styling:
 * - Uses CSS Grid with 2 columns (minmax(min-content, 2fr) and minmax(min-content, 1fr))
 * - Each group uses subgrid to align content with controls
 * - Content appears in column 1, group controls in column 2
 * - Global stylesheets are automatically adopted into the shadow DOM
 */
export class FormRepeatableElement extends HTMLElement {
	static formAssociated = true;
	static _globalStyleSheets = null;
	static _globalStylesInitialized = false;

	static get observedAttributes() {
		return ['add-label', 'remove-label', 'min', 'max'];
	}

	/**
	 * Get global stylesheets from the document, cached at class level
	 * @private
	 */
	static _getGlobalStyleSheets() {
		if (this._globalStylesInitialized) {
			return this._globalStyleSheets || [];
		}

		this._globalStylesInitialized = true;
		this._globalStyleSheets = [];

		try {
			for (const sheet of document.styleSheets) {
				try {
					// Test if we can access cssRules (will throw for CORS-blocked sheets)
					const rules = Array.from(sheet.cssRules);
					if (rules.length > 0) {
						const adoptedSheet = new CSSStyleSheet();
						const css = rules
							.map((rule) => rule.cssText)
							.join('\n');
						adoptedSheet.replaceSync(css);
						this._globalStyleSheets.push(adoptedSheet);
					}
				} catch (e) {
					// Skip CORS-blocked or inaccessible stylesheets
					console.debug(
						'form-repeatable: Skipping inaccessible stylesheet',
						sheet.href,
					);
				}
			}
		} catch (e) {
			console.warn('form-repeatable: Error loading global styles', e);
		}

		return this._globalStyleSheets;
	}

	/**
	 * Reset the global stylesheet cache (useful for testing or dynamic stylesheet changes)
	 * @public
	 */
	static resetGlobalStyles() {
		this._globalStyleSheets = null;
		this._globalStylesInitialized = false;
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this._template = null;
		this._groups = [];
		this._nextId = 1;
		this._countRegex = /(.*)(\d+)(.*)/;
		this._listenersInitialized = false;
		this._handleShadowClick = this._handleShadowClick.bind(this);
		this._handleFormInteraction = this._handleFormInteraction.bind(this);

		// Adopt global stylesheets into shadow DOM
		this._adoptGlobalStyles();
	}

	/**
	 * Adopt global stylesheets into this shadow root
	 * @private
	 */
	_adoptGlobalStyles() {
		try {
			const globalSheets = this.constructor._getGlobalStyleSheets();
			if (globalSheets.length > 0) {
				this.shadowRoot.adoptedStyleSheets = [
					...globalSheets,
					...this.shadowRoot.adoptedStyleSheets,
				];
			}
		} catch (e) {
			console.warn('form-repeatable: Could not adopt global styles', e);
		}
	}

	connectedCallback() {
		this.__upgradeProperty('addLabel');
		this.__upgradeProperty('removeLabel');
		this.__upgradeProperty('min');
		this.__upgradeProperty('max');

		this._extractTemplate();
		this._initializeGroups();
		this._render();
		this._updateFormValue();

		if (!this._listenersInitialized) {
			this.shadowRoot.addEventListener('click', this._handleShadowClick);
			this.addEventListener('input', this._handleFormInteraction);
			this.addEventListener('change', this._handleFormInteraction);
			this._listenersInitialized = true;
		}
	}

	disconnectedCallback() {
		if (!this._listenersInitialized) {
			return;
		}
		this.shadowRoot.removeEventListener('click', this._handleShadowClick);
		this.removeEventListener('input', this._handleFormInteraction);
		this.removeEventListener('change', this._handleFormInteraction);
		this._listenersInitialized = false;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		if (this.shadowRoot.children.length > 0) {
			this._render();
			this._updateFormValue();
		}
	}

	// Getters
	get addLabel() {
		return this.getAttribute('add-label') || 'Add Another';
	}
	set addLabel(value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute('add-label');
		} else {
			this.setAttribute('add-label', String(value));
		}
	}

	get removeLabel() {
		return this.getAttribute('remove-label') || 'Remove';
	}
	set removeLabel(value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute('remove-label');
		} else {
			this.setAttribute('remove-label', String(value));
		}
	}

	_handleShadowClick(event) {
		const target = event
			.target instanceof HTMLElement
			? event.target.closest('button')
			: null;
		if (!target || !this.shadowRoot.contains(target)) {
			return;
		}
		if (target.classList.contains('add')) {
			event.preventDefault();
			this._addGroup();
			return;
		}
		if (target.classList.contains('remove')) {
			event.preventDefault();
			const groupId = parseInt(target.dataset.groupId || '', 10);
			if (!Number.isNaN(groupId)) {
				this._removeGroup(groupId);
			}
		}
	}

	_handleFormInteraction(event) {
		const target = event.target;
		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement
		) {
			this._updateFormValue();
		}
	}

	get min() {
		const attr = this.getAttribute('min');
		if (!attr) {
			return 1;
		}

		const value = parseInt(attr, 10);
		// Check if the original string equals the parsed value (catches decimals)
		if (isNaN(value) || value <= 0 || attr !== value.toString()) {
			console.warn(
				`form-repeatable: Invalid min value "${attr}". Using default of 1.`,
			);
			return 1;
		}
		return value;
	}
	set min(value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute('min');
			return;
		}
		const parsed = Number(value);
		if (Number.isInteger(parsed) && parsed > 0) {
			this.setAttribute('min', String(parsed));
			return;
		}
		console.warn(
			`form-repeatable: Invalid min value "${value}". Using default of 1.`,
		);
		this.removeAttribute('min');
	}

	get max() {
		const value = parseInt(this.getAttribute('max'), 10);
		if (this.hasAttribute('max')) {
			if (isNaN(value) || !Number.isInteger(value)) {
				console.warn(
					`form-repeatable: Invalid max value "${this.getAttribute('max')}". Ignoring max limit.`,
				);
				return null;
			}
			if (value <= this.min) {
				console.warn(
					`form-repeatable: max (${value}) must be greater than min (${this.min}). Ignoring max limit.`,
				);
				return null;
			}
		}
		return this.hasAttribute('max') ? value : null;
	}
	set max(value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute('max');
			return;
		}
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			console.warn(
				`form-repeatable: Invalid max value "${value}". Ignoring max limit.`,
			);
			this.removeAttribute('max');
			return;
		}
		if (parsed <= this.min) {
			console.warn(
				`form-repeatable: max (${parsed}) must be greater than min (${this.min}). Ignoring max limit.`,
			);
			this.removeAttribute('max');
			return;
		}
		this.setAttribute('max', String(parsed));
	}

	__upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	// Template extraction
	_extractTemplate() {
		// Check for explicit <template> element
		const templateEl = this.querySelector('template');
		if (templateEl) {
			this._template =
				templateEl.content.firstElementChild?.cloneNode(true);
			templateEl.remove();
			if (!this._template) {
				console.error('form-repeatable: <template> element is empty');
			}
			return;
		}

		// Use first child as template
		const firstChild = this.children[0];
		if (!firstChild) {
			console.error(
				'form-repeatable: No template or initial group found. Component requires at least one child element.',
			);
			return;
		}

		// Clone the first child to create template
		this._template = firstChild.cloneNode(true);

		// Convert numbered patterns to {n} placeholders
		this._templatize(this._template);
	}

	// Convert numeric patterns to {n} placeholders in template
	_templatize(element) {
		// Process all attributes
		for (const attr of element.attributes) {
			const match = attr.value.match(this._countRegex);
			if (match) {
				const [, prefix, number, suffix] = match;
				attr.value = `${prefix}{n}${suffix}`;
			}
		}

		// Process text content in specific elements
		if (element.tagName === 'LABEL' || element.tagName === 'LEGEND') {
			const match = element.textContent.match(this._countRegex);
			if (match) {
				const [, prefix, number, suffix] = match;
				element.textContent = `${prefix}{n}${suffix}`;
			}
		}

		// Recurse through children
		for (const child of element.children) {
			this._templatize(child);
		}
	}

	// Initialize groups from light DOM
	_initializeGroups() {
		// Move all existing children to shadow DOM as groups
		const children = Array.from(this.children);

		if (children.length === 0 && this._template) {
			// No initial groups, create one from template
			this._addGroup();
		} else {
			// Move existing children into shadow DOM
			children.forEach((child, index) => {
				const group = {
					id: this._nextId++,
					element: child,
					index: index,
				};
				this._groups.push(group);
			});
		}
	}

	// Add a new group
	_addGroup() {
		if (this.max !== null && this._groups.length >= this.max) {
			return;
		}

		if (!this._template) {
			console.error(
				'form-repeatable: Cannot add group without a template',
			);
			return;
		}

		const newElement = this._template.cloneNode(true);
		const groupNumber = this._groups.length + 1;

		// Replace {n} placeholders with actual number
		this._fillTemplate(newElement, groupNumber);

		const group = {
			id: this._nextId++,
			element: newElement,
			index: this._groups.length,
		};

		this._groups.push(group);
		this._render();
		this._updateFormValue();

		this.dispatchEvent(
			new CustomEvent('form-repeatable:added', {
				bubbles: true,
				composed: true,
				detail: { group, groupCount: this._groups.length },
			}),
		);
	}

	// Fill template placeholders with actual values
	_fillTemplate(element, number) {
		// Process all attributes
		for (const attr of element.attributes) {
			attr.value = attr.value.replace(/{n}/g, number);
		}

		// Process text content
		if (element.tagName === 'LABEL' || element.tagName === 'LEGEND') {
			element.textContent = element.textContent.replace(/{n}/g, number);
		}

		// Recurse through children
		for (const child of element.children) {
			this._fillTemplate(child, number);
		}
	}

	// Remove a group
	_removeGroup(groupId) {
		const index = this._groups.findIndex((g) => g.id === groupId);
		if (index === -1) return;

		if (this._groups.length <= this.min) {
			return;
		}

		const [removed] = this._groups.splice(index, 1);

		// Renumber remaining groups
		this._renumberGroups();

		this._render();
		this._updateFormValue();

		this.dispatchEvent(
			new CustomEvent('form-repeatable:removed', {
				bubbles: true,
				composed: true,
				detail: { group: removed, groupCount: this._groups.length },
			}),
		);
	}

	// Renumber all groups sequentially
	_renumberGroups() {
		this._groups.forEach((group, index) => {
			const newNumber = index + 1;
			this._updateGroupNumber(group.element, newNumber);
		});
	}

	// Update numbering in a group's element
	_updateGroupNumber(element, number) {
		// Update attributes
		for (const attr of element.attributes) {
			const match = attr.value.match(this._countRegex);
			if (match) {
				const [, prefix, oldNumber, suffix] = match;
				attr.value = `${prefix}${number}${suffix}`;
			}
		}

		// Update text content
		if (element.tagName === 'LABEL' || element.tagName === 'LEGEND') {
			const match = element.textContent.match(this._countRegex);
			if (match) {
				const [, prefix, oldNumber, suffix] = match;
				element.textContent = `${prefix}${number}${suffix}`;
			}
		}

		// Recurse through children
		for (const child of element.children) {
			this._updateGroupNumber(child, number);
		}
	}

	// Update form value via ElementInternals
	_updateFormValue() {
		const formData = new FormData();

		this._groups.forEach((group) => {
			const inputs = group.element.querySelectorAll(
				'input, select, textarea',
			);
			inputs.forEach((input) => {
				if (input.name && !input.disabled) {
					if (input.type === 'checkbox' || input.type === 'radio') {
						if (input.checked) {
							formData.append(input.name, input.value || 'on');
						}
					} else if (input.type === 'file') {
						if (input.files) {
							Array.from(input.files).forEach((file) => {
								formData.append(input.name, file);
							});
						}
					} else {
						formData.append(input.name, input.value);
					}
				}
			});
		});

		this._internals.setFormValue(formData);
	}

	// Render the shadow DOM
	_render() {
		const canAdd = this.max === null || this._groups.length < this.max;
		const canRemove = this._groups.length > this.min;

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}

				.groups {
					display: grid;
					grid-template-columns: minmax(min-content, 2fr) minmax(min-content, 1fr);
					row-gap: .5rem;
					column-gap: 1rem;
				}

				.group {
					display: grid;
					grid-column: 1 / 3;
					grid-template-columns: subgrid;
					align-items: end;
				}

				.content {
					display: block;
				}

				.group-controls {
					display: block;
					align-self: inline-start;
				}

				.controls {
					display: block;
					margin-block-start: 1rem;
				}

				button {
					white-space: nowrap;
				}

				.group-controls:empty {
					display: none;
				}
			</style>
			<div part="groups" class="groups">
			${this._groups
				.map((group, index) => {
					const showRemove = canRemove;
					const removeLabel = this._getRemoveLabel(group.element);

					return `
					<div part="group" class="group" data-group-id="${group.id}">
						<div part="content" class="content"></div>
						<div part="controls group-controls" class="group-controls">
							${showRemove ? `<button part="button remove-button" class="remove" type="button" data-group-id="${group.id}" aria-label="${removeLabel}">${this.removeLabel}</button>` : ''}
						</div>
					</div>
				`;
				})
				.join('')}
			</div>
			<div part="controls" class="controls">
				${canAdd ? `<button part="button add-button" class="add" type="button">${this.addLabel}</button>` : ''}
			</div>
		`;

		// Move group elements into their content containers
		this._groups.forEach((group, index) => {
			const groupContainer =
				this.shadowRoot.querySelectorAll('[part="group"]')[index];
			const contentContainer =
				groupContainer.querySelector('[part="content"]');
			contentContainer.appendChild(group.element);
		});
	}

	// Get accessible label for remove button
	_getRemoveLabel(element) {
		const label = element.querySelector('label');
		const legend = element.querySelector('legend');
		const labelText = (label || legend)?.textContent.trim();

		if (labelText) {
			return `${this.removeLabel} ${labelText}`;
		}
		return this.removeLabel;
	}

	// Form lifecycle callbacks
	formResetCallback() {
		// Reset all inputs to default values
		this._groups.forEach((group) => {
			const inputs = group.element.querySelectorAll(
				'input, select, textarea',
			);
			inputs.forEach((input) => {
				if (input.type === 'checkbox' || input.type === 'radio') {
					input.checked = input.defaultChecked;
				} else {
					input.value = input.defaultValue;
				}
			});
		});
		this._updateFormValue();
	}

	formDisabledCallback(disabled) {
		this._groups.forEach((group) => {
			const inputs = group.element.querySelectorAll(
				'input, select, textarea, button',
			);
			inputs.forEach((input) => {
				input.disabled = disabled;
			});
		});

		const buttons = this.shadowRoot.querySelectorAll('button');
		buttons.forEach((button) => {
			button.disabled = disabled;
		});
	}
}
