# form-repeatable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-repeatable.svg)](https://www.npmjs.com/package/@aarongustafson/form-repeatable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-repeatable/ci.yml?branch=main)](https://github.com/aarongustafson/form-repeatable/actions)

A single-instance web component that manages repeatable form field groups internally using shadow DOM and native form participation via the ElementInternals API.

## Features

- 🔄 **Manage repeatable field groups** - single component instance manages all groups
- 🔢 **Auto-increment** numeric values in labels, IDs, and `for` attributes
- ❌ **Add and remove groups** dynamically with min/max constraints
- 📋 **Native form participation** - uses ElementInternals API for seamless form integration
- 🎨 **Flexible templating** - use first child or explicit `<template>` element
- 🌍 **Global styles** - automatically adopts page stylesheets into shadow DOM
- 🎯 **Modern CSS Grid layout** - default 2-column layout with subgrid support
- 📦 **Zero dependencies** - pure web component
- ♿ **Accessible** - semantic HTML with proper ARIA labels
- 🎯 **TypeScript-ready** with type definitions

## Demo

[Live Demo](https://aarongustafson.github.io/form-repeatable/demo/) ([Source](./demo/index.html))

**Additional Examples:**

- [unpkg CDN](https://aarongustafson.github.io/form-repeatable/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [esm.sh CDN](https://aarongustafson.github.io/form-repeatable/demo/esm.html) ([Source](./demo/esm.html))

## Installation

```bash
npm install @aarongustafson/form-repeatable
```

## Usage

### Option 1: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormRepeatableElement } from '@aarongustafson/form-repeatable';

customElements.define('my-custom-name', FormRepeatableElement);
```

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/form-repeatable/define.js';
```

If you prefer to control when the element is registered, call the helper directly:

```javascript
import { defineFormRepeatable } from '@aarongustafson/form-repeatable/define.js';

defineFormRepeatable();
```

You can also include the guarded script from HTML:

```html
<script src="./node_modules/@aarongustafson/form-repeatable/define.js" type="module"></script>
```

### Basic Example

```html
<form>
  <form-repeatable>
    <div>
      <label for="stop-1">Stop 1</label>
      <input id="stop-1" type="text" name="stops[]">
    </div>
  </form-repeatable>
</form>
```

The component uses the first child as a template. When the user clicks "Add Another":
1. Clones the template
2. Increments numbers ("Stop 1" → "Stop 2", `stop-1` → `stop-2`)
3. Appends the new group to the shadow DOM
4. Shows remove buttons when more than the minimum groups exist
5. Updates the form value via ElementInternals

### Progressive Enhancement with Pre-populated Groups

You can provide multiple initial groups that will be moved into the shadow DOM:

```html
<form>
  <form-repeatable min="2">
    <div>
      <label for="phone-1">Phone 1</label>
      <input id="phone-1" type="tel" name="phones[]" value="555-0100">
    </div>
    <div>
      <label for="phone-2">Phone 2</label>
      <input id="phone-2" type="tel" name="phones[]" value="555-0101">
    </div>
    <div>
      <label for="phone-3">Phone 3</label>
      <input id="phone-3" type="tel" name="phones[]">
    </div>
  </form-repeatable>
</form>
```

All child elements become groups managed by the single component instance.

### Multiple Fields per Group

Each group can contain multiple related fields:

```html
<form-repeatable>
  <fieldset>
    <legend>Guest 1</legend>
    <label for="guest-name-1">Name</label>
    <input id="guest-name-1" type="text" name="guest-name-1">

    <label for="guest-email-1">Email</label>
    <input id="guest-email-1" type="email" name="guest-email-1">
  </fieldset>
</form-repeatable>
```

All numeric values in labels, IDs, and attributes are incremented when new groups are added.

### Explicit Template with Placeholders

Instead of using the first child as a template, you can provide an explicit `<template>` element with `{n}` placeholders:

```html
<form-repeatable>
  <template>
    <div>
      <label for="email-{n}">Email {n}</label>
      <input id="email-{n}" type="email" name="emails[]">
    </div>
  </template>
</form-repeatable>
```

The `{n}` placeholders are replaced with sequential numbers (1, 2, 3, etc.).

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `add-label` | `string` | `"Add Another"` | Custom label for the "Add" button |
| `remove-label` | `string` | `"Remove"` | Custom label for the "Remove" button. The accessible name (`aria-label`) is automatically composed by combining this with the first label/legend text (e.g., "Remove Stop 1"). |
| `min` | `number` | `1` | Minimum number of groups (must be > 0). Remove buttons are hidden when at minimum. |
| `max` | `number` | `null` | Maximum number of groups (optional, must be > min). Add button is hidden when at maximum. |

### Example with Min/Max Constraints

```html
<form-repeatable min="2" max="5" add-label="Add Team Member" remove-label="Remove Member">
  <div>
    <label for="member-1">Team Member 1</label>
    <input id="member-1" type="text" name="members[]">
  </div>
</form-repeatable>
```

This creates a component that:
- Starts with 1 group (will allow adding until min is met)
- Cannot have fewer than 2 groups
- Cannot have more than 5 groups
- Uses custom button labels

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `form-repeatable:added` | Fired when a new group is added | `{ group: Object, groupCount: number }` |
| `form-repeatable:removed` | Fired when a group is removed | `{ group: Object, groupCount: number }` |

### Example Event Handling

```javascript
const repeatable = document.querySelector('form-repeatable');

repeatable.addEventListener('form-repeatable:added', (event) => {
  console.log('Group added. Total groups:', event.detail.groupCount);
});

repeatable.addEventListener('form-repeatable:removed', (event) => {
  console.log('Group removed. Total groups:', event.detail.groupCount);
});
```

## CSS Parts

The component exposes CSS parts that allow you to style internal shadow DOM elements:

| Part | Description |
|------|-------------|
| `groups` | Container for all groups (default: CSS grid with 2-column layout) |
| `group` | Each repeatable group wrapper (default: subgrid spanning both columns) |
| `content` | Container for the group's fields (default: column 1) |
| `group-controls` | Container for group-level controls, remove button (default: column 2) |
| `controls` | Container for field-level controls, add button (default: below groups) |
| `button` | Both buttons (style all buttons together) |
| `add-button` | The "Add Another" button |
| `remove-button` | The "Remove" buttons |

### Example Styling

```css
/* Style all buttons */
form-repeatable::part(button) {
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Style the add button specifically */
form-repeatable::part(add-button) {
  background: #28a745;
  color: white;
}

form-repeatable::part(add-button):hover {
  background: #218838;
}

/* Style the remove button specifically */
form-repeatable::part(remove-button) {
  background: #dc3545;
  color: white;
}

/* Style each group */
form-repeatable::part(group) {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

/* Customize the grid layout */
form-repeatable::part(groups) {
  grid-template-columns: 1fr auto; /* Adjust column sizes */
  gap: 1rem;
}
```

## Default Styling

The component uses a **CSS Grid layout** by default:

- **Two columns**: `minmax(min-content, 2fr)` for content, `minmax(min-content, 1fr)` for controls
- **Subgrid**: Each group uses `subgrid` to align with the parent grid
- **Column 1**: Group content (fields, labels, etc.)
- **Column 2**: Remove buttons (aligned to the right)
- **Below groups**: Add button appears after all groups
- **Global styles**: Page stylesheets are automatically adopted into the shadow DOM

You can override the grid layout using `::part(groups)` as shown above.

### Advanced Styling

The component uses Shadow DOM with adopted stylesheets. You can style it using:

1. **CSS parts** (shown above) - style internal shadow DOM elements
2. **Global stylesheets** - automatically adopted into shadow DOM, so page styles apply
3. **Host element** - style the component container itself

```css
/* Style the host element */
form-repeatable {
  display: block;
  margin-bottom: 2rem;
}

/* Global styles automatically apply to elements in shadow DOM */
input,
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
}
```

## Form Participation

This component uses the **ElementInternals API** for native form participation:

- **Automatic submission**: All inputs within groups are collected and submitted with the form
- **FormData integration**: Values are added to FormData automatically
- **Form reset**: Supports native form reset functionality
- **Disabled state**: Respects form disabled state
- **Browser support**: 95% (Chrome 77+, Firefox 93+, Safari 16.4+)

The component is form-associated (`static formAssociated = true`) and manages form values internally using `attachInternals()`.

## How It Works

The component uses a **single-instance architecture**:

1. **Template extraction**: Parses the first child element (or explicit `<template>`) to create a reusable template
2. **Number detection**: Identifies numeric patterns using regex `/(.*)(\d+)(.*)/` and converts to `{n}` placeholders
3. **Group initialization**: Moves all light DOM children into shadow DOM as initial groups
4. **Adding groups**: Clones the template, replaces `{n}` with sequential numbers, appends to shadow DOM
5. **Removing groups**: Removes the group and renumbers remaining groups sequentially (1, 2, 3...)
6. **Form value sync**: Collects all inputs from groups and updates FormData via ElementInternals
7. **Global styles**: Automatically adopts page stylesheets into shadow DOM for consistent styling

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ElementInternals API
- Adopted Stylesheets
- CSS Grid & Subgrid
- ES Modules

**Supported browsers:**
- Chrome/Edge 117+ (for subgrid support)
- Firefox 71+ (for subgrid support)
- Safari 16.4+ (for ElementInternals support)

For broader browser support without subgrid, you can override the default grid layout using CSS parts. For older browsers, you may need polyfills from [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

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

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
