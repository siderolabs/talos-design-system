# Changelog

Each release lists two kinds of change. **Act on** is a change to what a component should look like or how it behaves: a product has to change its own code to follow it, and the audit may not notice if it doesn't. **Arrives by itself** is a token value or tooling change that a product picks up by reinstalling.

## Unreleased

Act on:

- **The typefaces are Fontsource dependencies**, `@fontsource-variable/manrope` and `@fontsource-variable/jetbrains-mono`, instead of files under `fonts/`, which is gone along with the `./fonts/*` export. The families are now `Manrope Variable` and `JetBrains Mono Variable`, and the font tokens name them. A product that imports `fonts.css` through a bundler needs nothing more. A product that copied `fonts/` (the docs site does) copies the packages' `files/` instead, with the new file names `mintlify.css` expects; a product that names `Manrope` or `JetBrains Mono` itself rather than using the tokens switches to the new names. Integration guide, Typefaces.

## 0.8.0

Act on:

- **Stylelint covers every stylesheet**, not only SCSS: plain CSS (a Tailwind entry file included), SCSS and Vue `<style>` blocks. A product, Tailwind or not, runs it over every stylesheet kind it has, for example `stylelint "src/**/*.{css,scss,vue}"`, and records what it finds in its suppressions baseline. The SCSS and Vue syntaxes ship with the package, so a product that installed `postcss-scss` or `postcss-html` and set `customSyntax` for them can drop both. Integration guide, Enforcement.

Arrives by itself:

- **TypeScript declarations** for the `eslint`, `stylelint` and `audit` entry points, so an `eslint.config.ts` needs no `declare module`. A typed stylelint config spreads the shipped one rather than listing it in `extends`; the integration guide has the shape.
- **`no-raw-color` ignores HTML character references** such as `&#8230;` and text inside comments, which it used to report as hex colours.

## 0.7.0

Act on:

- **No italic in UI text.** Manrope has no italic, and a browser asked for one slants the upright face. Emphasis is weight or colour, and a disabled or placeholder state is its colour role. Code comments stay italic, now in JetBrains Mono's own italic. Style guide, Typography.
- **`fonts.css` points at `../fonts/`**, the package's own layout, so a bundler that imports it from the package serves the files with no copying. A product that copied `dist/fonts.css` somewhere and put the fonts beside it re-points its `url()`s.

Arrives by itself:

- **`tailwind-spacing.css`**, the spacing steps as Tailwind utilities and nothing else, for a product adopting spacing before type. Imported beside `tailwind-colour.css`. Integration guide, Tailwind v4 consumers.
- **`talos-migrate-spacing`**, which renames Tailwind spacing utilities that are already on a step (`p-4` to `p-compact`) and lists the ones between steps. A product using `tailwind-merge` adds the step names to its config; the integration guide has the snippet.
- **Cyrillic, Cyrillic Extended and Greek** for both typefaces, and **JetBrains Mono italic**. 15 files, 186 kB in the package; a page downloads only the subsets its characters need, so an English-only page fetches the same two files as before.

## 0.6.2

Act on:

- **A chart whose segments are states takes `status-*-chart`**, not `-default`. This was the intent when `-chart` arrived in 0.5.0, but three sentences in the style guide and `AGENTS.md` still said `-default`. Only light changes: there `-chart` is the lighter step that sits with the series (warning `#EBA42C` rather than mustard `#B87C06`). On dark the two are the same colour.

## 0.6.1

Act on:

- **A status chip that needs an action stays a chip.** The action (mute, acknowledge, retry) is a separate neutral control beside it, and a muted item stops being a status. Style guide, "When a status needs an action".
- **Links in tables and lists keep their text colour.** A record name that opens its record stays `body-strong` in `content-emphasis`; other linked cells stay `body` in `content-default`; hover underlines in `accent-text`. Style guide, Accent.
- **A status edge on a card or row is `status-*-default` in both themes.** Style guide, Status.
- **Key/value values are `body`, not `body-strong`**, and an audit log's action column is `mono`. Type roles, worked examples.

Arrives by itself:

- `talos-audit` gains a `roles` check, on by default: status chips that are the whole of a button or link, and accent text standing alone in a table cell. A page that passed 0.6.0 can report findings here without any of its code changing.
- `AGENTS.md` has an upgrade procedure.

## 0.6.0

Act on:

- Nothing required. **Dim** is an optional second dark theme; a product that offers it adds a fourth choice to the theme menu.

Arrives by itself:

- `[data-theme="dim"]` in `tokens.css`, and dim entries in the SCSS and JSON outputs.

## 0.5.0

Act on:

- **Theme choice is a Light, Dark and System menu** from one icon button at the right end of the top bar, default System, stored under `theme`, applied before first paint. A two-state toggle does not qualify. Style guide, "Choosing a theme".
- **Status chips carry a glyph, not a dot.** Six state glyphs in `docs/iconography.md`; the dot stays only for levels, chart legends and category chips. Marker dots are 8px, not 6px.

Arrives by itself:

- On light, `status-*-text` is lifted and `status-*-default` becomes a separate, lighter graphic step (warning `#B87C06`, success `#0A9D49`, danger `#F14F47`). Anything drawn in `-default` gets lighter.
- Light series colours refitted. Chip edges and light status surface borders fitted to a contrast floor.

## 0.4.0

Act on:

- **A selected segment is a neutral thumb**: `surface-inert` on a `surface-inset` track, `border-strong` ring, `content-emphasis` label. Not the accent fill, which now means something is switched on.
- **Charts take `series-1` onward in order**, and code highlighting takes the `syntax-*` roles.

Arrives by itself:

- New roles: `series-*`, `on-series-*`, `syntax-*`, `highlight-*`, `border-control`, `border-focus`, `surface-scrim`, `shadow-focus`.

## 0.3.4

Arrives by itself:

- `tailwind-colour.css`, a colour-only Tailwind theme for products adopting colour before type and spacing.
