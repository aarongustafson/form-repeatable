import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const source = await readFile(
	new URL('../../form-repeatable.js', import.meta.url),
	'utf8',
);
const demoCSS = await readFile(
	new URL('../../demo/styles.css', import.meta.url),
	'utf8',
);
const demoSource = await readFile(
	new URL('../../demo/index.html', import.meta.url),
	'utf8',
);
const definitionSource = await readFile(
	new URL('../../define.js', import.meta.url),
	'utf8',
);
const readme = await readFile(
	new URL('../../README.md', import.meta.url),
	'utf8',
);
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// The study's 62 observations reduce to these 19 token palettes.
// Substitution checks authored CSS, not actual forced-color repainting.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(css, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token, palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/g,
		(token) => colors[token],
	);
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const context = document.createElement('canvas').getContext('2d');
		if (!context) throw new Error('Canvas measurement unavailable.');
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const parent = (node) => node.parentElement || node.getRootNode().host;
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = parent(node)) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Opacity would require group compositing.');
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const wash = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!wash)
						throw new Error(
							`Unsupported background: ${style.backgroundImage}`,
						);
					paint(wash[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected opaque measurement surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const foreground = paint(style.color);
		const surround = background(parent(element));
		background(element);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return {
			text: ratio(foreground, fill),
			boundary: Math.max(
				ratio(fill, surround),
				paintsBorder ? ratio(border, surround) : 1,
			),
		};
	});
}

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definitionSource.replace(
				"'./form-repeatable.js'",
				"'http://127.0.0.1:4179/form-repeatable.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page
			.locator('form-repeatable')
			.first()
			.getByRole('button', { name: /Add/ })
			.last(),
	).toBeVisible();
}

for (const example of ['live', 'copyable', 'README']) {
	test(`${example}: custom Remove text and its necessary boundary have sufficient contrast`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1400, height: 900 });
		await demo(page);
		const host = page.locator('#styled-form form-repeatable');
		if (example !== 'live') {
			const css =
				example === 'README'
					? readme.match(/```css\n([\s\S]*?)```/)[1]
					: (
							await page
								.locator('pre code')
								.filter({
									hasText:
										'form-repeatable.custom::part(button)',
								})
								.textContent()
						).match(/<style>([\s\S]*?)<\/style>/)[1];
			await page.locator('head > style').evaluate((style, css) => {
				style.textContent = css;
			}, css);
		}
		const add = host.getByRole('button', {
			name: 'Add Another',
			exact: true,
		});
		expect((await measurements(add)).text).toBeGreaterThanOrEqual(4.5);
		expect((await measurements(add)).boundary).toBeGreaterThanOrEqual(3);
		await add.hover();
		await expect(add).toHaveCSS('opacity', '1');
		expect((await measurements(add)).text).toBeGreaterThanOrEqual(4.5);
		await add.click();
		const remove = host.getByRole('button', {
			name: 'Remove Task 1',
			exact: true,
		});
		expect((await measurements(remove)).text).toBeGreaterThanOrEqual(4.5);
		expect((await measurements(remove)).boundary).toBeGreaterThanOrEqual(3);
		await remove.hover();
		await expect(remove).toHaveCSS('opacity', '1');
		expect((await measurements(remove)).text).toBeGreaterThanOrEqual(4.5);
	});
}

test('all 19 palettes preserve page, adopted styles, controls and status contrast', async ({
	page,
}) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 1400, height: 900 });
	await demo(page);
	const hosts = page.locator('form-repeatable');
	const colorVariants = page.locator(
		'#basic-form form-repeatable, #styled-form form-repeatable',
	);
	for (const host of await colorVariants.all()) {
		const add = host.locator('[part~="add-button"]');
		if (await add.count()) await add.click();
	}
	const sheets = await hosts
		.first()
		.evaluate((host) =>
			host.shadowRoot.adoptedStyleSheets.map((sheet) =>
				[...sheet.cssRules].map((rule) => rule.cssText).join('\n'),
			),
		);
	const inlineCSS = [...demoSource.matchAll(/<style>([\s\S]*?)<\/style>/g)]
		.map((match) => match[1])
		.join('\n');
	for (const [index, palette] of palettes.entries()) {
		const style = await page.addStyleTag({
			content: substitute(demoCSS + inlineCSS, palette),
		});
		await hosts.evaluateAll(
			(elements, css) => {
				for (const host of elements)
					host.shadowRoot.adoptedStyleSheets.forEach((sheet, index) =>
						sheet.replaceSync(css[index]),
					);
			},
			sheets.map((css) => substitute(css, palette)),
		);
		for (const selector of [
			'.demo-section > p',
			'.output',
			'.info-box',
			'.api-reference',
			'footer',
			'pre code',
		]) {
			for (const element of await page.locator(selector).all())
				expect(
					(await measurements(element)).text,
					`palette ${index}: ${selector}`,
				).toBeGreaterThanOrEqual(4.5);
		}
		for (const host of await colorVariants.all()) {
			for (const control of await host
				.locator(
					'input:not([type=checkbox],[type=radio]), select, textarea, button',
				)
				.all()) {
				if (!(await control.isVisible())) continue;
				expect(
					(await measurements(control)).text,
					`palette ${index}: control text`,
				).toBeGreaterThanOrEqual(4.5);
				expect(
					(await measurements(control)).boundary,
					`palette ${index}: control edge`,
				).toBeGreaterThanOrEqual(3);
				if (
					await control.evaluate(
						(element) => element.tagName === 'BUTTON',
					)
				) {
					await control.hover();
					await expect(control).toHaveCSS('opacity', '1');
					expect(
						(await measurements(control)).text,
						`palette ${index}: hover text`,
					).toBeGreaterThanOrEqual(4.5);
					expect(
						(await measurements(control)).boundary,
						`palette ${index}: hover edge`,
					).toBeGreaterThanOrEqual(3);
				}
			}
		}
		await style.evaluate((element) => element.remove());
	}
});

for (const scheme of ['light', 'dark']) {
	test(`${scheme}: native control pair contrast`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			browserName === 'webkit' &&
				process.platform === 'linux' &&
				scheme === 'dark',
			'Known bundled Ubuntu WebKit native dark ButtonText/ButtonFace limitation.',
		);
		await page.emulateMedia({ colorScheme: scheme });
		await demo(page);
		const probe = await page.locator('body').evaluateHandle((body) => {
			const span = document.createElement('span');
			span.style.cssText = 'background:ButtonFace;color:ButtonText';
			body.append(span);
			return span;
		});
		expect((await measurements(probe)).text).toBeGreaterThanOrEqual(4.5);
	});

	test(`${scheme}: native field and generated button focus remain visible`, async ({
		page,
		browserName,
	}) => {
		await page.emulateMedia({ colorScheme: scheme });
		await demo(page);
		const host = page.locator('#basic-form form-repeatable');
		const input = host.getByRole('textbox', {
			name: 'Stop 1',
			exact: true,
		});
		await input.focus();
		await expect(input).toHaveCSS('outline-style', 'auto');
		await page.keyboard.press(
			browserName === 'webkit' && process.platform === 'darwin'
				? 'Alt+Tab'
				: 'Tab',
		);
		const add = host.getByRole('button', {
			name: 'Add Another',
			exact: true,
		});
		await expect(add).toBeFocused();
		await expect(add).toHaveCSS('outline-style', 'auto');
		await expect(add).toHaveCSS('opacity', '1');
		await page.keyboard.press('Space');
		await expect(host.getByRole('textbox')).toHaveCount(2);
		await expect(
			host.getByRole('button', { name: 'Add Another', exact: true }),
		).toBeFocused();
		await expect(
			host.getByRole('button', { name: 'Add Another', exact: true }),
		).toBeInViewport();
	});
}

test('native form values, labels, min/max and event feedback survive add/remove', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('#basic-form form-repeatable');
	await host
		.getByRole('textbox', { name: 'Stop 1', exact: true })
		.fill('London');
	await host
		.getByRole('button', { name: 'Add Another', exact: true })
		.click();
	await host
		.getByRole('textbox', { name: 'Stop 2', exact: true })
		.fill('Paris');
	expect(
		await page
			.locator('#basic-form')
			.evaluate((form) => new FormData(form).getAll('stops[]')),
	).toEqual(['London', 'Paris']);
	await host
		.getByRole('button', { name: 'Remove Stop 2', exact: true })
		.click();
	await expect(
		host.getByRole('textbox', { name: 'Stop 1', exact: true }),
	).toHaveValue('London');
	await expect(host.locator('[part~="remove-button"]')).toHaveCount(0);
	await expect(
		host.getByRole('button', { name: 'Add Another', exact: true }),
	).toBeFocused();
	await host.evaluate((element) => {
		element.max = 2;
	});
	await host
		.getByRole('button', { name: 'Add Another', exact: true })
		.click();
	await expect(host.locator('[part~="add-button"]')).toHaveCount(0);
	await expect(
		host.getByRole('button', { name: 'Remove Stop 2', exact: true }),
	).toBeFocused();
	const events = page.locator('#event-repeatable');
	await events
		.getByRole('button', { name: 'Add Another', exact: true })
		.click();
	await expect(page.locator('#event-log')).toContainText(
		'form-repeatable:added - Group count: 2',
	);
	await events
		.getByRole('button', { name: 'Remove Ingredient 2', exact: true })
		.click();
	await expect(page.locator('#event-log')).toContainText(
		'form-repeatable:removed - Group count: 1',
	);
});

test('rerenders retain field focus and choose an adjacent Remove action', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('#basic-form form-repeatable');
	const input = host.getByRole('textbox', { name: 'Stop 1', exact: true });
	await input.fill('Oslo');
	await host.evaluate((element) => {
		element.addLabel = 'Add stop';
	});
	await expect(input).toBeFocused();
	await expect(input).toHaveValue('Oslo');
	const phones = page.locator('#prepopulated-form form-repeatable');
	await phones
		.getByRole('button', { name: 'Remove Phone 1', exact: true })
		.click();
	await expect(
		phones.getByRole('button', { name: 'Remove Phone 1', exact: true }),
	).toBeFocused();
	await expect(
		phones.getByRole('textbox', { name: 'Phone 1', exact: true }),
	).toHaveValue('555-0101');
});

test('form-data output renders entered markup as literal text', async ({
	page,
}) => {
	await demo(page);
	const value = '<img src=x onerror=alert(1)>';
	await page.locator('#event-name').fill(value);
	await page
		.locator('#combined-form form-repeatable')
		.getByRole('button', { name: 'Add Another', exact: true })
		.click();
	await expect(page.locator('#combined-output img')).toHaveCount(0);
	await expect(page.locator('#combined-output pre')).toContainText(value);
});

test('forced colors retain automatic adjustment, names, native focus and usable controls', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Only Chromium supports forced-color emulation.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await demo(page);
	const host = page.locator('#styled-form form-repeatable');
	await host
		.getByRole('button', { name: 'Add Another', exact: true })
		.click();
	await host.getByRole('textbox').first().focus();
	await page.keyboard.press('Tab');
	for (const button of await host.getByRole('button').all()) {
		await button.focus();
		await expect(button).toHaveCSS('forced-color-adjust', 'auto');
		await expect(button).toHaveCSS('outline-style', 'auto');
		await expect(button).toHaveCSS('opacity', '1');
		expect((await measurements(button)).text).toBeGreaterThanOrEqual(4.5);
		expect((await measurements(button)).boundary).toBeGreaterThanOrEqual(3);
	}
});

test('increased contrast retains full-strength supporting text', async ({
	page,
}) => {
	await page.emulateMedia({ contrast: 'more' });
	await demo(page);
	const color = await page
		.locator('body')
		.evaluate((body) => getComputedStyle(body).color);
	await expect(page.locator('footer')).toHaveCSS('color', color);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: code/live pairs and added groups reflow`, async ({
		page,
	}) => {
		await demo(page, name);
		for (const host of await page.locator('form-repeatable').all()) {
			const add = host.locator('[part~="add-button"]');
			if (await add.count()) await add.click();
		}
		for (const width of [1400, 1024, 768, 320]) {
			await page.setViewportSize({ width, height: 900 });
			const pairs = page.locator('.code-demo-pair');
			expect(await pairs.count()).toBeGreaterThan(0);
			for (const pair of await pairs.all()) {
				const code = await pair.locator(':scope > pre').boundingBox();
				const live = await pair.locator('.demo').boundingBox();
				if (width >= 768)
					expect(code.x + code.width).toBeLessThanOrEqual(live.x + 1);
				else
					expect(code.y + code.height).toBeLessThanOrEqual(
						live.y + 1,
					);
			}
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
		}
	});
	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} retains labeled native fields and authored values`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
				colorScheme: 'dark',
				viewport: { width: 320, height: 900 },
			});
			const page = await context.newPage();
			try {
				if (failure === 'module failure')
					await page.route(
						/define\.js|form-repeatable\.js|https:\/\/esm\.sh\/|https:\/\/unpkg\.com\//,
						(route) => route.abort(),
					);
				await page.goto(`/demo/${name}`);
				const fields = page
					.locator('form-repeatable input')
					.filter({ visible: true });
				expect(await fields.count()).toBeGreaterThan(0);
				await expect(fields.first()).toHaveAccessibleName(/Stop|Email/);
				await fields.first().fill('Fallback value');
				await expect(fields.first()).toHaveValue('Fallback value');
				if (name === 'index.html')
					await expect(page.locator('#phone-1')).toHaveValue(
						'555-0100',
					);
				expect(
					await page.evaluate(
						() =>
							document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
			} finally {
				await context.close();
			}
		});
	}
}
