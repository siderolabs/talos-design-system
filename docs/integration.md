# Integration guide

How each stack takes the token package. The rules are in [`style-guide.md`](style-guide.md); the procedure an agent follows is in [`../AGENTS.md`](../AGENTS.md). This file is the mechanics.

## Outputs

| File | For | Contains |
| --- | --- | --- |
| `dist/tokens.css` | Any web product | `--talos-*` custom properties; dark under `:root`, light under `[data-theme="light"]` |
| `dist/tokens.scss` | Sass consumers (Bootstrap-based UIs) | `$talos-*` compile-time variables, `talos-tokens-dark` / `talos-tokens-light` mixins, and `talos-type($role)` |
| `dist/tailwind.css` | Tailwind v4 consumers | `@theme inline` block mapping utility names onto the custom properties, plus `type-*` role utilities |
| `dist/tailwind-colour.css` | Tailwind v4 consumers adopting colour first | The colour and elevation part of `tailwind.css` only, leaving the host's fonts, sizes and spacing alone |
| `dist/type.css` | Consumers without Tailwind or Sass | `.talos-type-*` classes, one per type role |
| `dist/fonts.css` | Any web product | `@font-face` rules for the two typefaces, pointing at `./fonts/` beside the stylesheet |
| `dist/mintlify.css` | The documentation site | Tokens, Mintlify's own theme variables re-pointed at them, `@font-face` rules at `/fonts/`, and the site's existing CSS with the colours tokenised |
| `dist/tokens.json` | Figma, docs, tooling | Resolved values with references and descriptions preserved |

## Getting the files

This repository is public to read and org-only to write. Consumers take it as a git dependency pinned to a release tag, which needs no registry and no credential, so a public product's open-source build keeps working for anyone who clones it:

```json
"dependencies": {
  "@siderolabs/talos-design-system": "github:siderolabs/talos-design-system#semver:^0.5.0"
}
```

Renovate and Dependabot both understand tagged git dependencies, so version bumps arrive as ordinary bot PRs in each consumer. Tags are treated as immutable: a released version never changes, a correction is a new tag.

The documentation site is the one exception. Mintlify offers no build step, so it vendors `dist/mintlify.css` and the font files directly (see below).

Publishing to npm would add provenance attestation and a smaller install, and nothing else. It can happen later or never without changing how consumers import anything.

## Tailwind v4 consumers

Import the two stylesheets in order, in place of the locally declared theme. Utility names are unchanged, so components do not move:

```css
@import '@siderolabs/talos-design-system/tokens.css';
@import '@siderolabs/talos-design-system/tailwind.css';
```

Neither file imports the other, and nothing in `dist/` assumes a package path, so the same two files also work vendored as plain copies if a consumer ever needs that.

`@theme inline` makes the generated utilities reference the custom property rather than copy its value, which is what lets the theme switch at runtime. Two older role names, `content-strong` and `surface-inverse`, are aliased in the same file so products already using them adopt by re-pointing rather than renaming.

## Bootstrap and Sass consumers

Bootstrap needs compile-time Sass variables for `$primary` and friends, so the SCSS build ships both forms. Replace the local token sheet and keep the host's existing custom-property names as aliases during migration:

```scss
@use '@siderolabs/talos-design-system/tokens.scss' as talos;

:root { @include talos.talos-primitives; @include talos.talos-tokens-dark; }
html[data-bs-theme='light'] { @include talos.talos-tokens-light; }

// Alias layer, deleted once components have migrated off the old names.
:root {
  --app-bg-card: var(--talos-surface-card);
  --app-text-primary: var(--talos-content-emphasis);
}
```

The mixins exist so the light theme can be emitted inside whatever selector the host already uses, rather than forcing every product onto `[data-theme]`.

Vite resolves `@siderolabs/talos-design-system/tokens.scss` through the package's exports. The Sass command line does not; there, write `@use 'pkg:@siderolabs/talos-design-system/tokens.scss'` and pass `--pkg-importer=node`.

## Documentation sites on Mintlify

Mintlify has no build step and cannot import from `node_modules`, so this one is vendored rather than imported. Mintlify applies every `.css` file in the content directory on every page, with no registration, so the generated sheet lands as its own file beside whatever hand-written CSS the site already has:

```
cp dist/mintlify.css <docs-repo>/public/talos-tokens.css
cp fonts/*.woff2 fonts/OFL-*.txt <docs-repo>/public/fonts/
```

Do not merge it into an existing stylesheet. This file is a build artifact and gets replaced wholesale on the next version bump, so anything hand-written that shares the file gets reverted silently. Keep site-specific rules (layout repairs, table treatments, per-page overrides) in their own file and have them reference `--talos-*` rather than raw values. Page-specific rules can be scoped with Mintlify's `html[data-current-path="..."]` selector so they do not apply site-wide.

One setting moves with them, because Mintlify reads the accent from configuration rather than from CSS. The generated file carries the exact block to paste into `public/docs.json`:

```json
"colors": { "primary": "#D41A3B", "light": "#E48E96", "dark": "#E12D46" }
```

Mintlify's `fonts` setting is deliberately left unset. It has no slot for a code face, and the `@font-face` rules in the stylesheet cover both faces without it.

## Typefaces

The faces are vendored here rather than loaded from Google Fonts, because an air-gapped install, a self-hosted product, or a docs mirror inside a customer network cannot reach `fonts.gstatic.com`. The failure mode is silent: the type falls back to a system font and the product stops looking like itself, and nobody files that as a bug.

Each consumer serves the four `woff2` files from somewhere and points the `@font-face` rules at it. `dist/fonts.css` assumes `./fonts/` beside the stylesheet; `dist/mintlify.css` uses `/fonts/` because Mintlify inlines custom CSS into the document, where a relative path resolves against the page URL and would break on nested routes.

Variable weight 400 to 700, latin and latin-ext, 81 kB for all four files. Both families are OFL 1.1, which permits redistribution, and the licences sit beside them.

## Anything else

`dist/tokens.css` and `dist/type.css` work regardless of framework. Import them, serve the fonts, and use the `--talos-*` custom properties and `talos-type-*` classes directly.

## Choosing a theme

The behaviour is in the [style guide](style-guide.md#choosing-a-theme). These are the parts every product implements the same way.

**Storage.** Local storage key `theme`, value `light`, `dark` or `system`. A missing or unrecognised value means System, so an older build never strands a reader on a value it doesn't know.

**The attribute goes on `<html>`.** Set `data-theme` to the resolved theme, `light` or `dark`, never `system`, and set `color-scheme` to match so native scrollbars and form controls follow. Custom properties resolve where they are declared, so a light block scoped to an app container leaves any menu or dialog that renders into `<body>` on the dark values. A Bootstrap host sets `data-bs-theme` alongside it.

**Apply it before first paint** with an inline script in `<head>`, ahead of the stylesheets and the app bundle:

```html
<script>
  (function () {
    var choice = 'system'
    try { choice = localStorage.getItem('theme') || 'system' } catch (e) {}
    var theme = choice === 'light' || choice === 'dark' ? choice
      : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  })()
</script>
```

The `try` is there because storage access throws in some privacy modes. Under a Content Security Policy that forbids inline script, give the tag the page's nonce rather than loosening the policy. Declare `<meta name="color-scheme" content="dark light">` as well.

**Follow the system while it's chosen.** Once the app is running, listen for changes to `prefers-color-scheme` and re-resolve when the choice is System. Anything that copied colours out of the tokens at start-up (a chart theme, a code editor theme) rebuilds when the resolved theme changes, the same as for [charts](../AGENTS.md).

**Documentation sites on Mintlify** get this from Mintlify's own switcher, which already offers Light, Dark and System. Its defaults in `docs.json` are the standard (`appearance.default` is `system`, and `strict` is off so the switcher shows), so leave `appearance` unset or set it to exactly those.

## Enforcement

```js
// eslint.config.js
import { designSystem } from '@siderolabs/talos-design-system/eslint'

export default [
  { plugins: { 'design-system': designSystem },
    rules: {
      'design-system/no-raw-color': 'error',
      'design-system/no-raw-font-size': 'error',
      'design-system/no-off-menu-spacing': 'error',   // Tailwind consumers
      'design-system/no-primitive-token': 'error',    // Tailwind consumers
    } },
]
```

```js
// stylelint.config.js
import talos from '@siderolabs/talos-design-system/stylelint'
export default { extends: [talos] }
```

Adopt with a suppressions file rather than a rewrite: record existing violations once, and the count only goes down.

`no-raw-font-size` flags a literal size anywhere in component code: `fontSize: 12` or `fontSize: '0.8rem'` in a style object, `font-size: 13px` in a style string or template, and Tailwind's `text-[13px]`. It allows `var(--talos-type-*)` and `var(--talos-text-*)`, keywords such as `inherit`, and expressions, and its message points at the type roles. Chart options take the same `fontSize` key and cannot resolve `var()`, so read the role's size at runtime:

```js
const axisLabel = getComputedStyle(document.documentElement).getPropertyValue('--talos-type-annotation-size')
```

## Verifying a page

The lint reads source. `talos-audit` reads what the browser computed, which is the only place a framework default, a chart library's 8px axis label or a Google Fonts link shows up. Run it on a migrated page to prove the page is on the system.

```
npm install --save-dev playwright && npx playwright install chromium
npx talos-audit https://localhost:5173/clusters
npx talos-audit --max 0 --json page-a.html page-b.html
npx talos-audit --storage-state auth.json --proxy socks5://127.0.0.1:8888 https://demo.example.com/machines
```

It reports, grouped by value with a count and example elements:

- Text below the 11px floor. 10px passes only on uppercase text with letter-spacing.
- Font sizes off the scale.
- Padding, margin and gap off the spacing menu. `0`, `auto`, percentages and 1px hairlines pass.
- Typefaces outside the Manrope and JetBrains Mono stacks, and our faces requested but not served by the page, with the face that renders instead.
- Fonts loaded from another origin.
- Colours that match no role in the active theme. Skipped, with a note, on a page that defines no `--talos-*` properties.

The scale, menu and stacks come from `dist/tokens.json`. `--max <n>` exits 1 when any page has more than `n` violations, so the same command gates CI or an agent's migration loop. `--checks type,spacing` narrows the run, `--theme light` sets `data-theme` and `data-bs-theme` first. Playwright is an optional peer dependency and the command says so if it is missing.

The browser half is `@siderolabs/talos-design-system/audit`, a plain module with no dependencies, for anyone driving a browser some other way.

## Working on this repository

```
tokens/         Source of truth. DTCG (W3C Design Tokens) JSON, hand-edited.
  primitive.json      Palette ramps and scales. Never referenced by app code.
  semantic.dark.json  Role definitions, dark theme (the default).
  semantic.light.json Role definitions, light theme.
  type-roles.json     Type roles: what a piece of text is, resolved onto the scale.
build/          Compiler, the contrast audit, and the font fetcher.
fonts/          The two typefaces as woff2, with their OFL licences. 81 kB.
dist/           Generated. Committed so consumers can use a file without building.
lint/           ESLint rules and a stylelint config, shipped with the package.
audit/          The rendered-page audit, run in a browser.
bin/            talos-audit, the command-line runner for the audit.
test/           Tests for the lint rules and the audit.
docs/           The style guide, the type role guide, this file, and the rendered preview.
```

Edit `tokens/`, run `npm run check`, commit `dist/`. Nothing else is hand-maintained.

```
npm run build      Compile tokens/ into dist/
npm run contrast   WCAG audit over every semantic pair; exits non-zero on a failure
npm run check      Both
npm test           Lint rule and audit tests. Needs `npm install` first.
npm run fonts      Re-download the typefaces. Rarely; the files are committed.
```

The build has no dependencies. The tests do (ESLint, the Vue parser and Playwright, all dev dependencies), which is why they sit outside `npm run check`. The source is valid DTCG, so Style Dictionary can replace the compiler later without touching the tokens, but publishing a token package should not depend on a toolchain being healthy first.
