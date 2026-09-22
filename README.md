# @siderolabs/talos-design-system

Design tokens and lint guardrails shared by Omni, Talos Director, Xenia and the Sidero portal.

The values come from the Talos Director skin, which implements the Sidero brand visual guide, with three contrast corrections documented in the style guide. One source of truth, four build outputs, one set of lint rules.

**Read [`docs/style-guide.md`](docs/style-guide.md) first.** It carries the rules; this file only covers mechanics.

To see the whole set rendered in both themes, open [`docs/preview.html`](docs/preview.html) in a browser. It reads `dist/tokens.css` directly, so it always shows what the build last produced.

## Layout

```
tokens/         Source of truth. DTCG (W3C Design Tokens) JSON, hand-edited.
  primitive.json      Palette ramps and scales. Never referenced by app code.
  semantic.dark.json  Role definitions, dark theme (the default).
  semantic.light.json Role definitions, light theme.
build/          Compiler, the contrast audit, and the font fetcher.
fonts/          The two typefaces as woff2, with their OFL licences. 81 kB.
dist/           Generated. Committed so consumers can use a file without building.
lint/           ESLint rules and a stylelint config, shipped with the package.
docs/           The style guide.
```

Edit `tokens/`, run `npm run check`, commit `dist/`. Nothing else is hand-maintained.

## Commands

```
npm run build      Compile tokens/ into dist/
npm run contrast   WCAG audit over every semantic pair; exits non-zero on a failure
npm run check      Both
npm run fonts      Re-download the typefaces. Rarely; the files are committed.
```

The build has no dependencies. The source is valid DTCG, so Style Dictionary can replace the compiler later without touching the tokens, but publishing a token package should not depend on a toolchain being healthy first.

## Outputs

| File | For | Contains |
| --- | --- | --- |
| `dist/tokens.css` | Any web product | `--talos-*` custom properties; dark under `:root`, light under `[data-theme="light"]` |
| `dist/tokens.scss` | Sass consumers (Director) | `$talos-*` compile-time variables plus `talos-tokens-dark` / `talos-tokens-light` mixins |
| `dist/tailwind.css` | Tailwind v4 consumers (Omni) | `@theme inline` block mapping utility names onto the custom properties |
| `dist/fonts.css` | Any web product | `@font-face` rules for the two typefaces, pointing at `./fonts/` beside the stylesheet |
| `dist/mintlify.css` | The documentation site | Tokens, Mintlify's own theme variables re-pointed at them, `@font-face` rules at `/fonts/`, and the site's existing CSS with the colours tokenised |
| `dist/tokens.json` | Figma, docs, tooling | Resolved values with references and descriptions preserved |

## Adopting it

### Omni (Vue, Tailwind v4)

Import the Tailwind build instead of declaring the theme locally. Utility names are unchanged, so components do not move:

```css
@import '@siderolabs/talos-design-system/tailwind.css';
```

`@theme inline` makes the generated utilities reference the custom property rather than copy its value, which is what lets the theme switch at runtime. Omni's existing `content-strong` and `surface-inverse` names are aliased in the same file so adoption is a re-point, not a rename.

### Talos Director (React, Bootstrap 5.3, SCSS)

Bootstrap needs compile-time Sass variables for `$primary` and friends, so the SCSS build ships both forms. Replace the local `_tokens.scss` and keep the `--yvm-*` names as aliases during migration:

```scss
@use '@siderolabs/talos-design-system/tokens.scss' as talos;

:root { @include talos.talos-primitives; @include talos.talos-tokens-dark; }
html[data-bs-theme='light'] { @include talos.talos-tokens-light; }

// Alias layer, deleted once components have migrated off --yvm-*.
:root {
  --yvm-bg-card: var(--talos-surface-card);
  --yvm-text-primary: var(--talos-content-emphasis);
}
```

The mixins exist so the light theme can be emitted inside whatever selector the host already uses, rather than forcing every product onto `[data-theme]`.

### Documentation site (Mintlify)

Mintlify has no build step and cannot import from `node_modules`, so this one is vendored rather than imported. Copy the stylesheet and the typefaces:

```
cp dist/mintlify.css ../docs/public/style.css
cp fonts/*.woff2 fonts/OFL-*.txt ../docs/public/fonts/
```

One setting moves with them, because Mintlify reads the accent from configuration rather than from CSS. The generated file carries the exact block to paste into `public/docs.json`:

```json
"colors": { "primary": "#C44740", "light": "#EB8A86", "dark": "#9D3530" }
```

Mintlify's `fonts` setting is deliberately left unset. It has no slot for a code face, and the `@font-face` rules in the stylesheet cover both faces without it.

### Typefaces

The faces are vendored here rather than loaded from Google Fonts, because an air-gapped Director, an on-prem Omni, or a docs mirror inside a customer network cannot reach `fonts.gstatic.com`. The failure mode is silent: the type falls back to a system font and the product stops looking like itself, and nobody files that as a bug.

Each consumer serves the four `woff2` files from somewhere and points the `@font-face` rules at it. `dist/fonts.css` assumes `./fonts/` beside the stylesheet; `dist/mintlify.css` uses `/fonts/` because Mintlify inlines custom CSS into the document, where a relative path resolves against the page URL and would break on nested routes.

Variable weight 400 to 700, latin and latin-ext, 81 kB for all four files. Both families are OFL 1.1, which permits redistribution, and the licences sit beside them. Director currently loads all of this from Google at runtime along with a third family (Mulish) that the design system does not use, so adopting this removes a font request and a stray typeface at the same time.

### Portal and Xenia

`dist/tokens.css` works regardless of framework. Xenia inherits whatever Director adopts.

## Enforcement

```js
// eslint.config.js
import { designSystem } from '@siderolabs/talos-design-system/eslint'

export default [
  { plugins: { 'design-system': designSystem },
    rules: {
      'design-system/no-raw-color': 'error',
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

## Contributing a change

A value you cannot find a role for is a token request, not a local override. Open an issue. Changes land as a version bump and each product picks them up on its next update, so drift is visible as a version number rather than invisible as a divergent hex.

`npm run contrast` must pass. Exceptions are listed in `build/contrast.mjs` with a reason; adding one is a decision to be argued, not a way to quiet the build.
