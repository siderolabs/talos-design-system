# Working with the Talos design system

Instructions for agents, and for people working the way an agent would. Two jobs come up: adopting the system in a product, and changing the system itself. They have different rules.

Read [`docs/style-guide.md`](docs/style-guide.md) and [`docs/type-roles.md`](docs/type-roles.md) before either. This file is the procedure; those are the rules.

## Adopting it in a product

The goal is a product whose rendered pages use only token values: colours from the semantic roles, sizes from the type roles, spacing from the menu, and the two typefaces served by the product itself. Work in this order. Each step is shippable on its own and the first carries most of the visible change.

1. **Install at a tag.** `"@siderolabs/talos-design-system": "github:siderolabs/talos-design-system#semver:^0.3.0"`. Never track `main`.
2. **Emit the tokens** the way the README describes for the product's stack: `tokens.css` plus `tailwind.css` for Tailwind (or `tailwind-colour.css` when the product is adopting colour before type and spacing), the `tokens.scss` mixins for Sass and Bootstrap, `tokens.css` plus `type.css` for anything else. Emit the light theme under whatever selector the product already uses for it.
3. **Serve the fonts from the product.** Copy `fonts/*.woff2` and the licences, import `fonts.css`, and delete every Google Fonts `<link>`, `preconnect` and `@import`. A product that loads type from a CDN loses it in an air-gapped install, silently.
4. **Map the product's existing variables onto the semantic roles,** keeping the old names as aliases so page code keeps working. If the product owner has supplied a mapping, follow it as written. If not, map by what the variable is used for, never by which token has the nearest value, and write the mapping down in the product repo.
5. **Give every piece of text a type role.** Classify it with the decision order in `docs/type-roles.md` and apply the role (`type-*` utility, `talos-type($role)` mixin, or `talos-type-*` class). The shipped size is evidence, not the answer: most 13px text becomes 14, not 12.
6. **Move spacing onto the menu.** Padding, margin and gap take `--talos-space-*` steps: 4, 8, 12, 16, 24, 32, 64. Pick the nearest step that keeps the layout; on a tie, match the siblings.
7. **Replace colour literals** with semantic roles, or delete them where the theme now supplies the colour. Then classify every coloured or chip-shaped element with the table in the style guide's "What colour means" and draw it that way. Colour and the pastel pill mean status; anything that is not a status gets neither, and a count of things in a state is a neutral number with the dot on its label.
8. **Charts read tokens at runtime.** Chart libraries cannot resolve `var()`, so read `--talos-type-annotation-size`, `--talos-font-sans` and the colour roles with `getComputedStyle`, build one shared chart theme, and rebuild it when the theme switches.
9. **Turn on the lint** (`@siderolabs/talos-design-system/eslint` and `/stylelint`, both in the README). Record existing violations as a suppressions baseline; the count only goes down.

### Verifying

A step is done when all of these hold, in both themes:

- The lint passes, apart from the recorded baseline.
- `npx talos-audit --max 0` passes on every route you touched, logged in where the product needs it (`--storage-state`), once with `--theme light` and once with `--theme dark`. If the product has known exceptions, set `--max` to the agreed count and say so.
- The page looks like the reference the product owner gave you. A visible difference is a mapping error or a question, never a reason to edit this repository.

Report what you changed, what the audit reported before and after, and every question you left open.

### What not to do

- **Don't invent a value.** A size off the scale, a spacing off the menu, or a colour outside the roles is a design question. Leave the closest token in place and raise it.
- **Don't edit tokens to make a product pass.** Changes to this repository go through its own review (below), never through a product migration.
- **Don't reach for primitives.** `--talos-red-5` and the other ramp steps exist so roles can reference them. Application code uses roles.
- **Don't re-decide a product's open questions.** If the product owner lists something as implemented as previewed and still open, implement it as previewed.
- **Don't restructure layouts.** This system covers colour, type and spacing. Moving elements, changing navigation or reworking a page is a separate conversation.

## Changing the system

Source is `tokens/`. `dist/` is generated and committed; never edit it by hand.

- Run `npm run check` (build and contrast audit) and `npm test` (lint rules and audit), and commit `dist/` with the source change.
- A type role must reference the scale for every field. The build fails on a literal, so a new size means a new step in `primitive.json`, which is a design decision, not a refactor.
- The contrast audit fails below the threshold for each pair. An exception goes in `build/contrast.mjs` with a reason. Don't add one to make a change pass.
- Every change is a pull request reviewed by the code owner. Tag releases; a published tag never moves.
