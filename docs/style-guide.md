# Talos Design System

**Status:** Draft v0.1 · September 20, 2026 · Owner: Sterling Koch

This is the style guide for every Talos product interface: Omni, Xenia, the Sidero portal, and the documentation site. It carries the values, the rules for using them, and the enforcement. If you are making a UI suggestion (including with an AI tool), point it at this document and the token package rather than at a screenshot of an existing product.

The values are a faithful implementation of the Sidero brand visual guide, as first realised in a reference skin that predates this package. Where this guide departs from that reference, it says so and says why.

## What this covers and what it does not

It covers tokens (colour, spacing, type, radius, elevation), the rules for choosing among them, and the lint that enforces them. It also covers navigation grammar, because that is where the products have drifted furthest apart.

It does not cover components. The consumers span Vue with Tailwind and React with Bootstrap, and a shared component library would mean rewriting one of them. Consistency at the component level comes from the anatomy notes here, implemented natively in each product.

## The two-tier model

Tokens are in two tiers and only one of them is for you.

**Primitives** are raw values: `ink-2`, `red-3`, `cream-0`. They carry no meaning about where they are used, and application code must never reference them. Reaching for a primitive is how a component stops following the theme.

**Semantic roles** name a job: `surface-card`, `content-muted`, `accent-fill`, `status-danger-text`. These are the contract. Every product uses the same role names, so a value change is a token release rather than a refactor, and a theme is a set of role values rather than a rewrite.

There are two themes, dark and light. Dark is the default. Both define exactly the same roles; a role in one and not the other fails the build.

## Colour

### Surfaces

A two-pole ladder. In dark, the well behind cards is the darkest plane and raised content reads brighter than the void behind it. In light the ladder inverts: the well is the most tinted plane and cards are pure white.

| Role | Use | Dark | Light |
| --- | --- | --- | --- |
| `surface-page` | Body, the well behind cards | `#060606` | `#EDE9E4` |
| `surface-chrome` | Topbar, sidenav | `#0B0B0B` | `#F5F0EB` |
| `surface-card` | Cards, tables, panels | `#1A1A1E` | `#FFFFFF` |
| `surface-inset` | Inputs, secondary buttons | `#1E1E22` | `#F0EBE5` |
| `surface-raised` | Modals, dropdowns, popovers | `#1E1E22` | `#FFFFFF` |
| `surface-hover` | Hover, tertiary fills | `#26262B` | `#E6E1DC` |
| `surface-inert` | Chart grid, tracks, skeletons | `#2E2E33` | `#D8D2CB` |
| `surface-subtle` | Tint wash over an unknown backdrop | white 5% | black 4% |
| `surface-paper` | Brand cream insert | `#E2D2A8` | `#E2D2A8` |

`surface-subtle` is translucent on purpose: nav items, chips and zebra rows sit on backdrops that vary, and a translucent wash keeps the relationship right wherever it lands.

### Text and icons

Four steps plus disabled. Every step except disabled meets WCAG AA on every surface in the ladder, which is verified on each build.

| Role | Use | Dark | Light |
| --- | --- | --- | --- |
| `content-emphasis` | Headings, active nav, key figures | `#F5F5F4` | `#1A1A18` |
| `content-default` | Body copy, table cells | `#C8C8C6` | `#3A3A38` |
| `content-secondary` | Labels, eyebrows, column headers | `#A8A8A6` | `#4F4F4D` |
| `content-muted` | Hints, placeholders, timestamps | `#919190` | `#636361` |
| `content-disabled` | Disabled controls only | `#5A5A58` | `#8A8A88` |

Disabled is the one role allowed below AA, because WCAG 1.4.3 exempts inactive controls. It is never the only signal that something is off: pair it with a cursor change, a tooltip, or a helper line.

### Accent

One saturated hue in the whole system. Sparing use is what makes it read as signal rather than decoration.

| Role | Use | Dark | Light |
| --- | --- | --- | --- |
| `accent-default` | Icons, borders, active nav indicators | `#E04B45` | `#E04B45` |
| `accent-text` | Accent-coloured text and links | `#EB8A86` | `#9D3530` |
| `accent-fill` | Primary button background | `#C44740` | `#C44740` |
| `accent-fill-hover` | Primary button hover | `#AE3B36` | `#AE3B36` |
| `accent-fill-active` | Primary button pressed | `#8E2A26` | `#8E2A26` |
| `accent-subtle` | Active nav item, selected row | red 10% | red 8% |

The brand red `#E04B45` is the accent everywhere it is decorative. It is not the button fill, because white text on it reaches 3.99:1 and AA needs 4.5:1. The fill is one step darker and the difference is hard to see side by side. Same reasoning for `accent-text`: the brand red as body text on a card reaches 4.3:1, so accent text is tinted on dark and shaded on light.

Budget: at most one accent fill per view. If a screen has two primary buttons, one of them is secondary.

### The brand gradient

Three stops, taken from the logo (`talos-by-sidero-labs-horiz-white.svg`): red into pink into orange. It comes in two weights for the same reason the accent does.

| Role | Use | Stops |
| --- | --- | --- |
| `accent-gradient` | Marks and rules. Nothing sits on top of it | `#E8312C` → `#E2335A` at 51% → `#F77216` |
| `accent-gradient-fill` | Any surface carrying text | `#C44740` → `#B5305A` at 51% → `#C2560F` |

The display gradient cannot hold text. Its orange stop is 2.85:1 against white, and the red and pink stops reach only 4.28:1 and 4.33:1, so a white label fails across the whole run and fails badly at the orange end. The fill gradient walks the same arc with every stop at or past AA, 4.53:1 at its worst point. Two of its three stops are existing brand values.

A gradient is more colour than a solid, not less, so it does not fix a surface that already feels over-coloured. Reach for it where the logo does: a mark, or a rule a few pixels tall. One gradient per view, and never behind long-form text.

The stops live in the palette as `gradient-display-1..3` and `gradient-fill-1..3`, which is the one place the palette carries a hue other than the brand red. They are there to be interpolated between and nothing else: a gradient stop is never a flat colour, and `no-primitive-token` will say so. `gradient-fill-1` is `red.4`, the accent fill reused rather than a new value.

`npm run contrast` measures all six. The fill stops are enforced at AA and the display stops are reported without being enforced, so the reason the two weights exist stays visible in the output rather than living only here. Interpolating between two stops never leaves the range they bound, so checking the stops covers the whole run.

### Our relationship to the marketing site

The marketing site is the same system. Its stylesheet ships our exact values, `--red: #E04B45`, `--red-soft: #C44740`, `--red-deep: #8E2A26`, the four-step content ramp, the three-step surface ramp, `#57C28A`, `#E2D2A8`, Manrope and JetBrains Mono. When the two disagree on a colour, that is a bug in one of them.

Product surfaces should be recognisably the same family as the marketing site without copying its composition. Marketing rebuilds its site on a cadence product cannot follow, and it optimises for a first impression rather than for someone reading the same page every day. So we take the palette, the typefaces and the vocabulary, and we decide layout, density and how much saturated area a page carries on our own terms. "Marketing does it this way" is evidence, not an argument.

### Status

Five roles per state, because a status hue does different jobs at different contrasts.

- `status-<state>-default` is the hue as a **graphic**: a dot, an icon, a chart series. It meets 3:1 on a card (WCAG 1.4.11).
- `status-<state>-text` is a **label on a normal surface** at 4.5:1.
- `status-<state>-fill` is a **solid** badge or button background, with `status-<state>-on-fill` as its label.
- `status-<state>-subtle` is the **tint** behind a tonal chip, which carries `-text` on top.

States are success (green `#57C28A`), warning (golden `#F0BB67`), danger (the brand red), and info (neutral grey). There is no blue: the brand palette does not have one, and info is a grey chip.

Solid green and golden fills carry a **dark** label, not white. White on brand green is 2.4:1.

Colour is never the only carrier of state. A status needs a word, an icon, or a position as well, and the status vocabulary itself is a separate open piece of work ([ux#15](https://github.com/siderolabs/ux/issues/15)).

### Borders

Hairlines, not weight. One width, `1px`, and separation comes from the surface ladder rather than from heavy rules.

`border-subtle` (6%) for internal dividers and table rows, `border-default` (8%) for card and input edges, `border-strong` (14% dark / 16% light) for hover and emphasis, `border-accent` for an active tab underline or a focused input.

These are translucent and well below 3:1 by design. That is allowed: every component they appear on is identifiable without its border. If a boundary is the only thing telling a user a control exists, it needs `border-strong` at minimum and probably needs rethinking.

## Spacing

Six named steps on an 8-point grid. Pick the role, never the number.

| Step | Value | Use |
| --- | --- | --- |
| `tight` | 8px | Inside a control: icon to label |
| `snug` | 12px | Between related elements in a group |
| `compact` | 16px | Dense content: table cells, list rows, toolbars |
| `base` | 24px | The default gutter: card padding, grid gaps |
| `section` | 32px | Between sections of a page |
| `major` | 64px | Page-level separation |

A value that is not on this menu is a design question, not a CSS decision. Bring it to the token repo as an issue rather than writing `padding: 18px`.

`compact` is new relative to the scale Omni shipped in August. Density is a feature in infrastructure tooling, screen real estate is not to be wasted, and a menu that jumps 12 to 24 forces dense tables into the wrong step.

## Typography

Manrope for UI and headings. JetBrains Mono as the machine voice: code, identifiers, versions, node names, and uppercase tracked labels.

The scale is dense on purpose. Base is 14px, not 16px, because these are operator consoles where a table row matters more than reading comfort at arm's length.

`2xs` 10px and `xs` 11px for labels and dense metadata, `sm` 12px for small buttons and badges, `base` 14px for body and tables and inputs and nav, `md` 16px for card titles, `lg` 20px for page titles, then `xl` 24px and `2xl` 30px for pages that carry marketing weight.

Weights are 400/500/600/700. Line height is `tight` 1.25 for headings, `base` 1.5 for body and tables, `relaxed` 1.65 for prose.

Both faces ship with the token package as woff2 and are served by the product, never fetched from Google at runtime. A product that loads its type from a CDN loses it in an air-gapped install, and loses it quietly: the page falls back to a system font and still works, so the report never comes.

## Elevation and focus

`shadow-card`, `shadow-dropdown`, `shadow-modal`. Elevation is carried by the surface ladder first; shadows are a secondary cue, deeper in dark mode because brightness alone cannot convey lift on a near-black canvas.

`shadow-focus` is the focus ring. It is never removed without a replacement, and `outline: none` without one is a defect.

## Navigation grammar

The products have drifted most here, and tokens do not fix it.

**The rail navigates collections and global surfaces. Tabs navigate facets of one object.** Rail items take you to a list (All VMs, Hosts, Clusters) or a global surface (Dashboard, Settings). Tabs on a detail page take you to a facet of the single thing you drilled into. Both halves are legitimate and most operator consoles work this way; what breaks is mixing them.

When a noun appears in both navs, it is the same noun at two scopes: the rail item is the fleet-wide view, the tab is this object's slice. Scope must be visible from the page itself, through the breadcrumb and title, not inferred from how you arrived.

**One global home per noun.** If Backups is reachable from two different rail sections, one of them is wrong.

**Tab budget: ten.** Past ten, group them. Fifteen ungrouped tabs is a second navigation system with no hierarchy, and it wraps to two rows at 1024px. Group by concern (Protection holding snapshots and backups, Observability holding metrics and alerts and events and logs) or move to a two-level detail layout.

**Names mean one thing.** "Cluster" currently means a cabinet of hosts and a Kubernetes cluster in the same rail. Qualify both rather than neither.

## The documentation site

The docs site runs on Mintlify, which owns its own layout and exposes colour, typeface and a stylesheet slot. Everything in this guide about colour and type applies; nothing about spacing or navigation does, because those are Mintlify's.

Three things are different there on purpose.

**Light is the default.** Reference material is read light far more often than dark, so `dist/mintlify.css` puts the light roles on `:root` and the dark roles under Mintlify's `.dark` class. The values are the same in both directions.

**Prose keeps Mintlify's 16px body.** The 14px base in the type scale is for operator consoles, where density is the point. Long-form reading is the opposite case and the docs site should not be talked into the console's scale.

**The neutral ramp is re-pointed, not just the accent.** Mintlify derives its greys from the primary colour, which is how the docs site ended up with a pink-tinted grey. Changing the accent alone leaves the chrome cold. The generated stylesheet maps `--gray-50` through `--gray-950` onto the cream and ink ramps, which is what actually makes the page read as the same product as the rest of the family.

## Deliberate deviations from the reference skin

Three, all for contrast, all verified by `npm run contrast`.

1. **The text ramp shifts up.** The reference's dim `#8A8A88` and faint `#5A5A58` are below AA as body text on every surface in the ladder (2.2:1 to 2.9:1). The four visible steps move lighter in dark mode and darker in light mode, and `#5A5A58` becomes disabled-only.
2. **The primary button fill darkens** from `#E04B45` to `#C44740`, so a white label reaches 4.86:1 instead of 3.99:1. The brand red is unchanged everywhere it is decorative.
3. **Light-mode status graphics darken.** A `#57C28A` dot on a white card is 2.2:1 and a `#F0BB67` one is 1.8:1, so in light mode the graphic and text roles use the deep variants while the fills stay the brand hues.

The reference skin already carries a scoped contrast remediation for green fills. That remediation is good work and its conclusion is the one adopted here: solid status fills carry dark labels. These three changes extend the same logic to the cases it did not reach.

## Enforcement

Rules that live only in a document decay. Each product runs the lint preset from the token package in CI.

- `no-raw-color` catches hex and rgb literals anywhere in a file. Applies to every codebase.
- `no-off-menu-spacing` requires the named steps instead of numeric spacing.
- `no-primitive-token` catches application code reaching past the semantic layer into a palette ramp.
- The stylelint config covers the same ground for SCSS.
- `npm run contrast` in the token repo fails the build when a role pair drops below its threshold. Exceptions are listed in the script with a reason, not silently skipped.

Adopt with a suppressions file rather than a rewrite. Existing violations are recorded once and the count only goes down, so new code is constrained from day one without blocking on a cleanup. Omni's August branch has 1,672 lines of recorded suppressions and that is the intended shape.

## Changing a token

A value you cannot find a role for is a token request, not a local override. Open an issue on the token repo. Changes land as a version bump, and each product picks them up when it updates the dependency, so you can see which product is on which version.

Cross-product visual decisions (a new role, a palette change, a new spacing step) go through Sterling. Product-local anatomy (how Omni lays out its cluster card) does not.
