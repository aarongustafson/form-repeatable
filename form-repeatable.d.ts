export declare class FormRepeatableElement extends HTMLElement {
	static formAssociated: boolean;
	static resetGlobalStyles(): void;
	addLabel: string;
	removeLabel: string;
	min: number;
	max: number | null;
	formResetCallback(): void;
	formDisabledCallback(disabled: boolean): void;
}

declare global {
	interface HTMLElementTagNameMap {
		'form-repeatable': FormRepeatableElement;
	}
}
