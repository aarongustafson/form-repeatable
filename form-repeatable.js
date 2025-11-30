/**
 * FormRepeatableElement - A web component that enables you to control the duplication of fields.
 *
 * @element form-repeatable
 *
 * @attr {string} example-attribute - Description of the attribute
 *
 * @fires form-repeatable:event-name - Description of the event
 *
 * @slot - Default slot for content
 *
 * @cssprop --component-name-color - Description of CSS custom property
 */
export class FormRepeatableElement extends HTMLElement {
	static get observedAttributes() {
		return ['example-attribute'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.render();
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
			</style>
			<slot></slot>
		`;
	}
}
