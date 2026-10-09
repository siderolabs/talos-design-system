# Working with the Talos design system

Instructions for agents, and for people working the way an agent would. Two jobs come up: adopting the system in a product, and changing the system itself. They have different rules.

Read [`docs/style-guide.md`](docs/style-guide.md), [`docs/type-roles.md`](docs/type-roles.md) and [`docs/iconography.md`](docs/iconography.md) before either. This file is the procedure; those are the rules.

## Adopting it in a product

The goal is a product whose rendered pages use only token values: colours from the semantic roles, sizes from the type roles, spacing from the menu, and the two typefaces served by the product itself. Work in this order. Each step is shippable on its own and the first carries most of the visible change.

1. **Install at a tag.** `"@siderolabs/talos-design-system": "github:siderolabs/talos-design-system#semver:^0.9.0"`. Never track `main`. Below 1.0 a caret range takes patch releases only, so a product on `^0.3.3` does not get 0.4 or later until someone moves the range. See [Upgrading](#upgrading).
2. **Emit the tokens** the way [`docs/integration.md`](docs/integration.md) describes for the product's stack: `tokens.css` plus `tailwind.css` for Tailwind (or `tailwind-colour.css`, then `tailwind-spacing.css` beside it, when the product is adopting colour and spacing before type), the `tokens.scss` mixins for Sass and Bootstrap, `tokens.css` plus `type.css` for anything else. Emit the light theme under whatever selector the product already uses for it.
3. **Serve the fonts from the product.** Import `fonts.css` from the package (a bundler resolves its imports of the `@fontsource-variable` packages; without one, serve those packages' stylesheets and files), and delete every Google Fonts `<link>`, `preconnect` and `@import`. A product that loads type from a CDN loses it in an air-gapped install, silently.
4. **Map the product's existing variables onto the semantic roles,** keeping the old names as aliases so page code keeps working. If the product owner has supplied a mapping, follow it as written. If not, map by what the variable is used for, never by which token has the nearest value, and write the mapping down in the product repo.
5. **Give every piece of text a type role.** Classify it with the decision order in `docs/type-roles.md` and apply the role (`type-*` utility, `talos-type($role)` mixin, or `talos-type-*` class). The shipped size is evidence, not the answer: most 13px text becomes 14, not 12.
6. **Move spacing onto the menu.** Padding, margin and gap take `--talos-space-*` steps: 4, 8, 12, 16, 24, 32, 64. In Tailwind, `npx talos-migrate-spacing` renames the values already on a step and lists the rest; ship that rename on its own, since it changes nothing on screen. For each remaining value, pick the step by role from the style guide's spacing table (icon to label is `micro`, card padding is `base`), and on a tie match the siblings. Padding inside controls, chips and rows sets their height with the line height, so decide it with step 5, not here.
7. **Replace colour literals** with semantic roles, or delete them where the theme now supplies the colour. Then classify every coloured or chip-shaped element with the table in the style guide's "What colour means" and draw it that way. Colour and the pastel pill mean status; anything that is not a status gets neither, and a count of things in a state is a neutral number with the status glyph on its label. Every status takes its glyph from the iconography guide; the dot stays only for levels, legends and categories.
8. **Charts read tokens at runtime.** Chart libraries cannot resolve `var()`, so read `--talos-type-annotation-size`, `--talos-font-sans` and the colour roles with `getComputedStyle`, build one shared chart theme, and rebuild it when the theme switches. Series take `series-1` onward in order; a chart whose series are states takes the status `-chart` colours instead.
9. **Offer the theme choice.** Light, Dark and System from an icon button at the right end of the top bar, default System, stored under `theme`, applied to `<html>` before first paint. The behaviour is in the style guide's "Choosing a theme" and the script in the integration guide. A product with a two-state toggle replaces it. Dim is optional; a product that offers it adds it as a fourth choice, with the icons in the iconography guide.
10. **Turn on the lint** (`@siderolabs/talos-design-system/eslint` and `/stylelint`, both in [`docs/integration.md`](docs/integration.md)). Record existing violations as a suppressions baseline; the count only goes down.

### Verifying

A step is done when all of these hold, in both themes:

- The lint passes, apart from the recorded baseline.
- `npx talos-audit --max 0` passes on every route you touched, logged in where the product needs it (`--storage-state`), once with `--theme light` and once with `--theme dark`. If the product has known exceptions, set `--max` to the agreed count and say so.
- The page looks like the reference the product owner gave you. A visible difference is a mapping error or a question, never a reason to edit this repository.
- Every piece of text you touched has the role the decision order gives it, checked by reading, not by the audit. The audit sees sizes and colours; a bold value or an ID in the proportional face passes it.

Report what you changed, what the audit reported before and after, and every question you left open.

### Upgrading

A minor release (0.5 to 0.6) can change what a component is supposed to look like, not only token values. Moving the range is a migration step of its own:

1. Move the range in `package.json` to the new minor and reinstall. Re-copy the fonts if the changelog says they changed.
2. Read [`CHANGELOG.md`](CHANGELOG.md) for every version you skipped. Each entry lists the spec changes a product has to act on, separately from token value changes that arrive by themselves.
3. Rerun `talos-audit` in every theme the product offers. New checks ship in patch and minor releases, so a page that was clean can report findings after an upgrade without any of its code changing.
4. Act on the spec changes the audit cannot see: component anatomy (a chip's glyph, a segmented control's thumb), behaviour (the theme menu), and role choices.

### What not to do

- **Don't invent a value.** A size off the scale, a spacing off the menu, or a colour outside the roles is a design question. Leave the closest token in place and raise it.
- **Don't edit tokens to make a product pass.** Changes to this repository go through its own review (below), never through a product migration.
- **Don't reach for primitives.** `--talos-red-5` and the other ramp steps exist so roles can reference them. Application code uses roles.
- **Don't re-decide a product's open questions.** If the product owner lists something as implemented as previewed and still open, implement it as previewed.
- **Don't restructure layouts.** This system covers colour, type and spacing. Moving elements, changing navigation or reworking a page is a separate conversation.

## Changing the system

Source is `tokens/`. `dist/` is generated and committed; never edit it by hand.

- Run `npm install` first; the build reads the font packages. Then run `npm run check` (build and contrast audit) and `npm test` (lint rules and audit), and commit `dist/` with the source change.
- A type role must reference the scale for every field. The build fails on a literal, so a new size means a new step in `primitive.json`, which is a design decision, not a refactor.
- The contrast audit fails below the threshold for each pair. An exception goes in `build/contrast.mjs` with a reason. Don't add one to make a change pass.
- Every change is a pull request reviewed by the code owner. Tag releases; a published tag never moves.
