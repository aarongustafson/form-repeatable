# form-repeatable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-repeatable.svg)](https://www.npmjs.com/package/@aarongustafson/form-repeatable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-repeatable/ci.yml?branch=main)](https://github.com/aarongustafson/form-repeatable/actions)

A web component that enables you to control the duplication of form fields. Ported from the [jQuery Repeatable Fields plugin](https://github.com/easy-designs/jquery.easy-repeatable-fields.js).

## Features

- 🔄 **Duplicate form fields** with a single click
- 🔢 **Auto-increment** numeric values in labels, IDs, and `for` attributes
- ❌ **Remove fields** individually
- 🎨 **Customizable** button labels and styling via CSS custom properties
- 📦 **Zero dependencies** - pure web component
- ♿ **Accessible** - uses semantic HTML
- 🎯 **TypeScript-ready** with type definitions

## Demo

[Live Demo](https://aarongustafson.github.io/form-repeatable/demo/) ([Source](./demo/index.html))

## Installation

```bash
npm install @aarongustafson/form-repeatable
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<form-repeatable>` custom element:

```javascript
import '@aarongustafson/form-repeatable';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/form-repeatable/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormRepeatableElement } from '@aarongustafson/form-repeatable/form-repeatable.js';

customElements.define('my-custom-name', FormRepeatableElement);
```

### Basic Example

```html
<form>
  <form-repeatable>
    <label for="stop-1">Stop 1</label>
    <input id="stop-1" type="text" name="stops[]">
  </form-repeatable>
</form>
```

When the user clicks "Add Another", the component will:
1. Clone itself
2. Increment the number in the label ("Stop 1" → "Stop 2")
3. Increment the `for` attribute (`stop-1` → `stop-2`)
4. Increment the input's `id` attribute
5. Clear any values in the new inputs
6. Make the original field removable

### Pre-populated Removable Fields

If your form has pre-existing values that should be removable, use the `removable` attribute:

```html
<form>
  <form-repeatable removable>
    <label for="phone-1">Phone 1</label>
    <input id="phone-1" type="tel" name="phones[]" value="555-0100">
  </form-repeatable>

  <form-repeatable removable>
    <label for="phone-2">Phone 2</label>
    <input id="phone-2" type="tel" name="phones[]" value="555-0101">
  </form-repeatable>

  <form-repeatable>
    <label for="phone-3">Phone 3</label>
    <input id="phone-3" type="tel" name="phones[]">
  </form-repeatable>
</form>
```

### Multiple Fields per Item

Each `<form-repeatable>` can contain multiple related fields:

```html
<form-repeatable>
  <label for="name-1">Name 1</label>
  <input id="name-1" type="text" name="name-1">

  <label for="email-1">Email 1</label>
  <input id="email-1" type="email" name="email-1">
</form-repeatable>
```

All numeric values in labels and IDs will be incremented appropriately.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `removable` | `boolean` | `false` | Marks this instance as removable and shows a "Remove" button instead of "Add Another" |
| `add-label` | `string` | `"Add Another"` | Custom label for the "Add" button |
| `remove-label` | `string` | `"Remove"` | Custom label for the "Remove" button. Note: The remove button's accessible name (`aria-label`) is automatically composed by combining this label with the text from the first label in the component (e.g., "Remove Phone 1"). |

### Example with Custom Labels

```html
<form-repeatable add-label="Add Item" remove-label="Delete Item">
  <label for="item-1">Item 1</label>
  <input id="item-1" type="text" name="items[]">
</form-repeatable>
```

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `form-repeatable:added` | Fired when a new field is added | `{ original: HTMLElement, clone: HTMLElement }` |
| `form-repeatable:removed` | Fired when a field is removed | `{ element: HTMLElement }` |

### Example Event Handling

```javascript
document.addEventListener('form-repeatable:added', (event) => {
  console.log('Field added:', event.detail.original, event.detail.clone);
});

document.addEventListener('form-repeatable:removed', (event) => {
  console.log('Field removed:', event.detail.element);
});
```

## CSS Parts

The component exposes CSS parts that allow you to style internal elements:

| Part | Description |
|------|-------------|
| `content` | The container for the slotted content |
| `button` | Both buttons (style all buttons together) |
| `add-button` | The "Add Another" button (combine with `button` for specific styling) |
| `remove-button` | The "Remove" button (combine with `button` for specific styling) |
| `controls` | The container for control buttons |

### Example Styling

```css
/* Style all buttons */
form-repeatable::part(button) {
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 4px;
}

/* Style the add button specifically */
form-repeatable::part(button add-button) {
  background: #007bff;
}

form-repeatable::part(button add-button):hover {
  background: #0056b3;
}

/* Style the remove button specifically */
form-repeatable::part(button remove-button) {
  background: #dc3545;
}

/* Style the controls container */
form-repeatable::part(controls) {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

/* Lay out content and controls side-by-side */
form-repeatable {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}
```

### Advanced Styling

The component uses Shadow DOM. You can style it using:

1. **CSS parts** (shown above) - style internal shadow DOM elements
2. **Slotted content** - style your form fields directly
3. **Host element** - style the component itself

```css
/* Style the host element */
form-repeatable {
  display: block;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 1rem;
}

/* Style slotted content */
form-repeatable label {
  font-weight: bold;
}

form-repeatable input {
  width: 100%;
}
```

## How It Works

The component automatically:

1. **Detects numeric patterns** in labels, IDs, and `for` attributes using the regex `/(.*)(\d+)(.*)/`
2. **Increments numbers** when cloning (e.g., "Item 1" → "Item 2", `field-3` → `field-4`)
3. **Updates associations** between labels and inputs
4. **Clears values** in newly created fields
5. **Manages button visibility** (only one "Add" button visible at a time)

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

**Supported browsers:**
- Chrome/Edge 79+
- Firefox 63+
- Safari 13+

For older browsers, you may need polyfills from [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## Migration from jQuery Plugin

If you're migrating from the original jQuery plugin:

### Before (jQuery)
```html
<ul>
  <li data-removable>
    <label for="stop-1">Stop 1</label>
    <input id="stop-1" type="text" name="stops[]" value="Foo">
  </li>
  <li data-repeatable>
    <label for="stop-2">Stop 2</label>
    <input id="stop-2" type="text" name="stops[]">
  </li>
</ul>

<script src="jquery.js"></script>
<script src="jquery.easy-repeatable-fields.js"></script>
```

### After (Web Component)
```html
<form>
  <form-repeatable removable>
    <label for="stop-1">Stop 1</label>
    <input id="stop-1" type="text" name="stops[]" value="Foo">
  </form-repeatable>

  <form-repeatable>
    <label for="stop-2">Stop 2</label>
    <input id="stop-2" type="text" name="stops[]">
  </form-repeatable>
</form>

<script type="module">
  import '@aarongustafson/form-repeatable';
</script>
```

**Key differences:**
- No jQuery dependency
- Use `removable` attribute instead of `data-removable`
- Each repeatable section is wrapped in `<form-repeatable>`
- Automatically handles button creation and management

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
