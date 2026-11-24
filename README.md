# form-repeatable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-repeatable.svg)](https://www.npmjs.com/package/@aarongustafson/form-repeatable)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-repeatable/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/form-repeatable/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/form-repeatable?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/form-repeatable)
[![License](https://img.shields.io/npm/l/@aarongustafson/form-repeatable)](https://github.com/aarongustafson/form-repeatable/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/form-repeatable)](https://github.com/aarongustafson/form-repeatable/blob/main/form-repeatable.d.ts)

`<form-repeatable>` adds and removes related form fields as a group. It numbers
labels and field identifiers, supports minimum and maximum group counts, and
includes group values in the containing form’s data.

Authored initial fields remain usable without JavaScript. After enhancement,
the component moves them into a shadow root and adds text buttons. It requires
form-associated custom element support and has no runtime dependencies.

## Demo

[Live Demo](https://aarongustafson.github.io/form-repeatable/demo/) ([Source](./demo/index.html))

**Additional Examples:**

- [unpkg CDN](https://aarongustafson.github.io/form-repeatable/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [esm.sh CDN](https://aarongustafson.github.io/form-repeatable/demo/esm.html) ([Source](./demo/esm.html))

The main demo covers [initial values](https://aarongustafson.github.io/form-repeatable/demo/#contact-information),
[explicit templates](https://aarongustafson.github.io/form-repeatable/demo/#email-template),
[related fields](https://aarongustafson.github.io/form-repeatable/demo/#education-history),
[translated labels](https://aarongustafson.github.io/form-repeatable/demo/#spanish-labels),
and [submission](https://aarongustafson.github.io/form-repeatable/demo/#event-registration).

## Installation

```bash
npm install @aarongustafson/form-repeatable
```

## Usage

### Option 1: Import the class and define manually

The main import exports the class without registering it. Register the tag used
in the examples below, or choose another name and update your HTML to match:

```javascript
import { FormRepeatableElement } from '@aarongustafson/form-repeatable';

customElements.define('form-repeatable', FormRepeatableElement);
```

### Option 2: Register with the definition helper

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/form-repeatable/define.js';
```

Importing the helper also attempts automatic registration. Calling it again is
safe; use the class-only import above if you need to control registration timing:

```javascript
import { defineFormRepeatable } from '@aarongustafson/form-repeatable/define.js';

defineFormRepeatable();
```

You can also include the guarded script from HTML:

```html
<script
  src="./node_modules/@aarongustafson/form-repeatable/define.js"
  type="module"
></script>
```

### Add and remove fields

```html
<form>
  <form-repeatable>
    <div>
      <label for="stop-1">Stop 1</label>
      <input id="stop-1" type="text" name="stops[]" />
    </div>
  </form-repeatable>
</form>
```

The first child supplies both the initial group and the template for new groups.
“Add Another” creates Stop 2, with a matching label and field ID. Each group gets
a Remove button when the count exceeds `min`. Without JavaScript, Stop 1 remains
an ordinary labeled field.

## Initial groups and templates

### Progressive Enhancement with Pre-populated Groups

You can provide multiple initial groups that will be moved into the shadow DOM:

```html
<form>
  <form-repeatable min="2">
    <div>
      <label for="phone-1">Phone 1</label>
      <input id="phone-1" type="tel" name="phones[]" value="555-0100" />
    </div>
    <div>
      <label for="phone-2">Phone 2</label>
      <input id="phone-2" type="tel" name="phones[]" value="555-0101" />
    </div>
    <div>
      <label for="phone-3">Phone 3</label>
      <input id="phone-3" type="tel" name="phones[]" />
    </div>
  </form-repeatable>
</form>
```

Each direct child element becomes a group; keep unrelated headings and other
content outside the component. The component preserves initial field values.
New groups start from the first group’s authored defaults, not its current edits,
then apply numbering. Adding a fourth phone here changes the template’s
`value="555-0100"` to `555-0104`; it doesn’t create a blank field. Use a blank
explicit template when new groups shouldn’t carry an initial value.

Put related fields inside one container, such as a `fieldset` with a `legend`.
The [guest and education demos](./demo/index.html#related-fields) show inputs,
selects, and textareas that are added and removed together.

### Explicit Template with Placeholders

Instead of using the first child as a template, you can provide an explicit `<template>` element with `{n}` placeholders:

```html
<form-repeatable>
  <template>
    <div>
      <label for="email-{n}">Email {n}</label>
      <input id="email-{n}" type="email" name="emails[]" />
    </div>
  </template>
</form-repeatable>
```

The component uses the template’s first element as the new group and replaces
`{n}` in attributes and label/legend text with the group number. It creates one
group when there are no authored initial groups. You can combine an explicit
template with initial groups to give new groups different defaults.

An explicit template is inert without JavaScript. Supply authored initial
groups instead when the page needs usable fields before enhancement or after a
module-loading failure.

### Numbering and field names

Use distinct ID prefixes for each component on a page. Names such as `phones[]`
stay the same across groups, producing repeated form entries. Numbered names,
IDs, and label `for` values change when groups are removed and renumbered.

Automatic numbering scans every attribute and label/legend text; it isn’t
limited to IDs. Its current pattern replaces the last digit it finds, not a
whole multi-digit number. Avoid unrelated digits in defaults, URLs, and other
attributes. Explicit `{n}` placeholders give you control when adding groups,
but removal still uses automatic numbering. Check removal carefully if your
groups can reach double-digit counts. Renumbering can also change a field’s
authored default and its current value if the user hasn’t edited it.

An empty template or missing initial group logs an error; Add cannot create a
group without a usable template.

## Attributes and properties

| Attribute      | Type     | Default         | Description                                                                                                                                                                    |
| -------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `add-label`    | `string` | `"Add Another"` | Custom label for the "Add" button                                                                                                                                              |
| `remove-label` | `string` | `"Remove"`      | Custom label for the "Remove" button. The accessible name (`aria-label`) is automatically composed by combining this with the first label/legend text (e.g., "Remove Stop 1"). |
| `min`          | `number` | `1`             | Minimum number of groups (must be > 0). Remove buttons are hidden when at minimum.                                                                                             |
| `max`          | `number` | `null`          | Maximum number of groups (optional, must be > min). Add button is hidden when at maximum.                                                                                      |

`min` must be a positive integer; invalid values fall back to `1` with a warning.
Author `max` as an integer greater than `min`; invalid limits are ignored with
a warning. The attribute parser uses `parseInt`, so some malformed `max` strings
are truncated rather than rejected. Property setters accept positive integers
and remove invalid limits.

Limits control adding and removing, not initial content: `min="2"` doesn’t
create a second initial group, and `max` doesn’t trim authored groups. Supply the
starting count you need. See the [limits demo](./demo/index.html#team-members).

| Property      | Reflects       |
| ------------- | -------------- |
| `addLabel`    | `add-label`    |
| `removeLabel` | `remove-label` |
| `min`         | `min`          |
| `max`         | `max`          |

Properties assigned before upgrade are reapplied when the component connects.
The package includes TypeScript declarations and an `HTMLElementTagNameMap`
entry for `form-repeatable`.

## Button vocabulary and translation

Set `add-label` and `remove-label` for your application’s vocabulary or language.
The component has no shared localization configuration. Translate your field
labels and legends too: a Remove button’s accessible name combines
`remove-label` with the first descendant label’s text, or the first legend if
there’s no label. For example, “Remove Stop 1” identifies the group being deleted.
If neither exists, its name is only `remove-label`.

Use trusted authored text for these labels and templates; the current runtime
inserts action labels into generated HTML without escaping them.

## Form values, reset, and disabled state

Before upgrade, native fields participate in the form normally. After upgrade,
the component collects named descendant `input`, `select`, and `textarea`
values into `FormData` through
[`ElementInternals.setFormValue()`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setFormValue).

- Unnamed and individually disabled fields are omitted.
- Checked checkboxes and radios contribute their values; unchecked ones don’t.
- File inputs contribute selected files. A select contributes its `.value`,
  not every selection in a multiple-select control.
- Input/change events, adding/removing groups, and attribute changes update
  the cached form data. If you change field values programmatically, dispatch
  `input` or `change` to refresh it.
- The component does **not** forward its fields’ constraint validity to the
  parent form. Handle validation in your application and on the server;
  `required` inside the shadow root doesn’t block parent-form submission.

Native form reset resets text inputs and textareas to `defaultValue`, and
checkboxes/radios to `defaultChecked`. It keeps the current group count; it
doesn’t restore removed groups. Select restoration isn’t implemented: the
callback assigns `defaultValue` rather than restoring the selected options.
File inputs with the usual empty default value clear their selection.

A disabled containing `fieldset` triggers the form-disabled callback, which
disables current fields and buttons. Re-enabling clears their disabled flags,
including authored individual disabled states. Controls rebuilt while the
component is disabled don’t retain that state automatically. Account for these
limits if your application changes configuration while disabled.

On disconnect, the component removes its shadow-root click, input, and change
listeners. It doesn’t restore fields to the light DOM. Reconnection initializes
again and can add a group; don’t assume detach/reattach is a state-preserving
reset.

## Methods

`FormRepeatableElement.resetGlobalStyles()` clears the page stylesheet snapshot
for future instances only. It doesn’t refresh existing shadow roots. There are
no public add/remove methods; use the generated buttons.

## Events

The component fires custom events that you can listen to:

| Event                     | Description                     | Detail                                  |
| ------------------------- | ------------------------------- | --------------------------------------- |
| `form-repeatable:added`   | Fired when a new group is added | `{ group: Object, groupCount: number }` |
| `form-repeatable:removed` | Fired when a group is removed   | `{ group: Object, groupCount: number }` |

Both events bubble and are composed (they cross shadow boundaries). `group`
contains the group’s `id`, `element`, and `index`; `groupCount` is the current
count. Creating a group from a template-only component also fires the added
event during initialization. Listen before registration if you need that event.

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

## Styling

### CSS parts

The component exposes CSS parts that allow you to style internal shadow DOM elements:

| Part             | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `groups`         | Container for all groups (default: CSS grid with 2-column layout)         |
| `group`          | Each repeatable group wrapper (default: subgrid spanning both columns)    |
| `content`        | Container for the group's fields (default: column 1)                      |
| `group-controls` | Container for group-level controls, remove button (default: column 2)     |
| `controls`       | Shared control containers: the main Add area and each group’s Remove area |
| `button`         | Both buttons (style all buttons together)                                 |
| `add-button`     | The "Add Another" button                                                  |
| `remove-button`  | The "Remove" buttons                                                      |

### Example Styling

The demos place Remove below the fields when the live example is narrow,
even when it sits beside a code panel in a wide window. Their
`demo/styles.css` uses a container query on `.demo` for that layout.

```css
/* Style all buttons */
form-repeatable::part(button) {
  padding: 0.5rem 1rem;
  font-weight: bold;
  border: 1px solid currentColor;
  border-radius: 4px;
  cursor: pointer;
}

/* Style the add button specifically */
form-repeatable::part(add-button) {
  background: #17652e;
  color: #fff;
}

form-repeatable::part(add-button):hover {
  background: #114b22;
}

/* Style the remove button specifically */
form-repeatable::part(remove-button) {
  background: #982b39;
  color: #fff;
}

form-repeatable::part(remove-button):hover {
  background: #761f2c;
}

/* Style each group */
form-repeatable::part(group) {
  padding: 1rem;
  background: Canvas;
  color: CanvasText;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

/* Customize the grid layout */
form-repeatable::part(groups) {
  grid-template-columns: 1fr auto; /* Adjust column sizes */
  gap: 1rem;
}
```

### Default layout and colors

The component uses a **CSS Grid layout** by default:

- **Two columns**: `minmax(min-content, 2fr)` for content, `minmax(min-content, 1fr)` for controls
- **Subgrid**: Each group uses `subgrid` to align with the parent grid
- **Column 1**: Group content (fields, labels, etc.)
- **Column 2**: Remove buttons (aligned to the right)
- **Below groups**: Add button appears after all groups
- **Global styles**: Page stylesheets are automatically adopted into the shadow DOM

The component does not inject a color palette. Without authored overrides,
fields and buttons use their browser defaults. Adopted page styles and
`::part()` rules can change them, so pair each foreground with its painted
background in resting, hover, and focus states. The example above uses tested
green/red pairs, visible action labels, and foreground-colored boundaries;
color is supplementary.

Keep the native focus indicator unless you provide an equally visible
replacement. Do not fade focused or hovered controls with opacity, and leave
automatic forced-color adjustment enabled.

You can override the grid layout using `::part(groups)` as shown above.

The demos stack fields and Remove controls below 600px so text fields retain
usable width. This is authored demo CSS, not a change to the component’s grid:

```css
@media (max-width: 600px) {
  form-repeatable::part(groups) {
    grid-template-columns: minmax(0, 1fr);
  }

  form-repeatable::part(group) {
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.5rem;
  }

  form-repeatable::part(button) {
    max-inline-size: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
```

### Advanced Styling

The component uses Shadow DOM with adopted stylesheets. You can style it using:

1. **CSS parts** (shown above) - style internal shadow DOM elements
2. **Global stylesheets** - automatically adopted into shadow DOM, so page styles apply
3. **Host element** - style the component container itself

The stylesheet snapshot is cached when the first instance is constructed.
Inaccessible cross-origin sheets are skipped with a debug message. Later page
stylesheet changes are not automatically copied into existing instances.
`FormRepeatableElement.resetGlobalStyles()` clears the snapshot for future
instances; it does not refresh existing shadow roots. Prefer `::part()` for
live author overrides.

```css
/* Style the host element */
form-repeatable {
  display: block;
  background: Canvas;
  color: CanvasText;
  margin-bottom: 2rem;
}

/* Global styles automatically apply to elements in shadow DOM */
input,
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  background: Field;
  color: FieldText;
  border: 1px solid FieldText;
  border-radius: 4px;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
}
```

## Labels and focus

Give every field a visible label, and use a legend for related fields. Include
the group number in the first label where possible so Remove names distinguish
groups; the component prefers a label over a legend. Add and Remove are native
`type="button"` controls. Their disappearance at limits is the count cue; the
component doesn’t announce count changes through a live region.

When controls rebuild, a focused field that remains keeps focus and its value.
Activating Add keeps focus on its replacement button; at the maximum, focus
moves to the last Remove button instead. Removing a group focuses the Remove
action at that position, or the previous one when deleting the last group.
If no Remove buttons remain, focus returns to Add. Native focus scrolling keeps
the action in view.

## Browser Support

The runtime requires ES modules, Custom Elements, Shadow DOM, `FormData`, and
form-associated custom elements with `attachInternals()` and `setFormValue()`.
If registration fails, authored initial fields remain usable; templates stay
inert. Generic custom element polyfills alone don’t establish form support.

Page stylesheet copying uses constructed `CSSStyleSheet` objects,
`replaceSync()`, and `adoptedStyleSheets`. If copying fails, the component skips
those styles; its controls still need appropriate authored styling.

CSS Grid and `subgrid` provide the default layout, not form participation.
You can replace the grid through CSS parts without `subgrid`. Test your target
browsers and layout rather than treating a floating usage percentage as a
support guarantee. See the [source](./form-repeatable.js),
[manifest](./custom-elements.json), and [declarations](./form-repeatable.d.ts)
for implementation and type details.

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

# Run browser behavior and color checks
npx playwright install
npm run test:browser

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

The browser suite uses Chromium, Firefox, and WebKit. It checks generated
controls, adopted styles, native FormData, fallback fields, and the study’s
19 distinct palettes. Palette substitution and forced-color emulation do not
replace testing real user color settings, zoom, keyboard operation, and
assistive technology.

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
