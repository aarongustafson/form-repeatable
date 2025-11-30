# form-repeatable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-repeatable.svg)](https://www.npmjs.com/package/@aarongustafson/form-repeatable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-repeatable/ci.yml?branch=main)](https://github.com/aarongustafson/form-repeatable/actions)

A web component that enables you to control the duplication of fields.

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
<form-repeatable>
  <!-- Your content here -->
</form-repeatable>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `form-repeatable:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('form-repeatable');

element.addEventListener('form-repeatable:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
form-repeatable {
  --example-color: #ff0000;
}
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

For older browsers, you may need polyfills.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

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
