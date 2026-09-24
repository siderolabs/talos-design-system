# Talos Design System

**Status:** Draft v0.2 · September 24, 2026 · Owner: Sterling Koch

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
| `surface-page` | Body, the well behind cards | `#060606` | `#F2EDE8` |
| `surface-chrome` | Topbar, sidenav | `#0B0B0B` | `#F5F0EB` |
| `surface-card` | Cards, tables, panels | `#1A1A1E` | `#FFFFFF` |
| `surface-inset` | Inputs, secondary buttons | `#1E1E22` | `#F0EBE5` |
| `surface-raised` | Modals, dropdowns, popovers | `#1E1E22` | `#FFFFFF` |
| `surface-hover` | Hover, tertiary fills | `#26262B` | `#E6E1DC` |
| `surface-inert` | Chart grid, tracks, skeletons | `#2E2E33` | `#D8D2CB` |
| `surface-subtle` | Tint wash over an unknown backdrop | white 5% | black 4% |
| `surface-paper` | Brand cream insert | `#E2D2A8` | `#E2D2A8` |

`surface-subtle` is translucent on purpose: nav items, chips and zebra rows sit on backdrops that vary, and a translucent wash keeps the relationship right wherever it lands.

The page well sits one barely visible step below the chrome, the same 1.03 luminance ratio in both themes. The reference skin's light well was `#EDE9E4`, which is too dark to carry accent text at AA.

### Text and icons

Four steps plus disabled. Every step except disabled meets WCAG AA on every surface in the ladder, which is verified on each build. The one open exception is `content-muted` on `surface-hover`, at 4.35:1 dark and 4.30:1 light; the audit lists it as pending a decision.

| Role | Use | Dark | Light |
| --- | --- | --- | --- |
| `content-emphasis` | Headings, active nav, key figures | `#F5F5F4` | `#1A1A18` |
| `content-default` | Body copy, table cells | `#C8C8C6` | `#3A3A38` |
| `content-secondary` | Labels, eyebrows, column headers | `#A8A8A6` | `#4F4F4D` |
| `content-muted` | Hints, placeholders, timestamps, subtitles, footers | `#8A8A88` | `#686866` |
| `content-disabled` | Disabled controls only | `#5A5A58` | `#8A8A88` |

Disabled is the one role allowed below AA, because WCAG 1.4.3 exempts inactive controls. It is never the only signal that something is off: pair it with a cursor change, a tooltip, or a helper line.

The rule for choosing: anything a person needs to read, including subtitles, stat labels, field hints and footers, is `content-muted` or louder. The disabled grey is for disabled text and nothing else.

### Accent

One saturated hue in the whole system. Sparing use is what makes it read as signal rather than decoration.

| Role | Use | Dark | Light |
| --- | --- | --- | --- |
| `accent-default` | Icons, borders, active indicators | `#E12D46` | `#E12D46` |
| `accent-text` | Accent-coloured text and links, the active nav marker bar | `#E48E96` | `#D41A3B` |
| `accent-fill` | Primary button background | `#E12D46` | `#E12D46` |
| `accent-fill-hover` | Primary button hover: the fill at 90% | `rgba(225, 45, 70, 0.9)` | `rgba(225, 45, 70, 0.9)` |
| `accent-fill-active` | Primary button pressed | `#8F2D36` | `#8F2D36` |
| `accent-subtle` | Active nav item pill, selected row | accent text 20% | accent text 8% |

The accent is a crimson, `#E12D46`, the centre of the banner gradient. It is both the decorative accent and the button fill: white on it is 4.50:1, which is AA with no headroom. That was a deliberate trade for a brighter accent, and the audit enforces it so a future edit cannot slip below.

The vivid fill cannot be used as text on cream, so the accent is two tokens rather than one. Accent text is tinted on dark (`#E48E96`, 7.1:1 on a card) and shaded on light (`#D41A3B`, 4.50:1 on the page well, 4.62:1 on the chrome, 5.24:1 on white).

The active nav item is the same in every product: emphasis text, a pill of `accent-subtle`, and a 3px bar in `accent-text` inset 6px from the left.

Budget: at most one accent fill per view. If a screen has two primary buttons, one of them is secondary.

### The brand gradient

The end colours come from the logo (`talos-by-sidero-labs-horiz-white.svg`), sampled in sRGB: hot red `#E8312C` and orange `#F77216`. There are two gradients.

| Role | Use | Stops |
| --- | --- | --- |
| `accent-gradient` | Marks and rules. Nothing sits on top of it | `#E8312C` → `#E2335A` at 51% → `#F77216`, 90° |
| `accent-gradient-fill` | Banners carrying a line of text | `#F77216` 0% → `#E12D46` 30% to 70% → `#E8312C` 100%, 270° |

The display gradient cannot hold text. Its orange stop is 2.85:1 against white, and the red and pink stops reach only 4.28:1 and 4.33:1.

The fill gradient holds the accent fill flat across its middle 40%, where centred banner text sits, and white on that band is 4.50:1. Its ends are the logo colours and do not carry white text. That is a known gap on narrow viewports, where a banner line can run into the ends, and the audit lists it as pending a decision.

A gradient is more colour than a solid, not less, so it does not fix a surface that already feels over-coloured. Reach for it where the logo does: a mark, a rule a few pixels tall, or the docs banner. One gradient per view, and never behind long-form text.

The end stops live in the palette as `gradient-display-1..3`, the one place the palette carries a hue outside the accent and status ramps. They are there to be interpolated between and nothing else: a gradient stop is never a flat colour, and `no-primitive-token` will say so.

`npm run contrast` measures every stop against white. The fill band is enforced as `accent-fill`, the fill gradient's ends are listed under a documented exception, and the display stops are reported without being enforced.

### Our relationship to the marketing site

The marketing site is the same family with two deliberate divergences. It still carries the older red (`--red: #E04B45` and its derived steps) where the product accent is the crimson `#E12D46`, and its status green `#57C28A` is 2.2:1 on a white card, so the product status palette is refitted for contrast (below). The proposal to bring the marketing site along is with marketing. Everything else matches: the four-step content ramp, the three-step surface ramp, `#E2D2A8`, Manrope and JetBrains Mono. Outside the accent and status ramps, when the two disagree on a colour, that is a bug in one of them.

Product surfaces should be recognisably the same family as the marketing site without copying its composition. Marketing rebuilds its site on a cadence product cannot follow, and it optimises for a first impression rather than for someone reading the same page every day. So we take the palette, the typefaces and the vocabulary, and we decide layout, density and how much saturated area a page carries on our own terms. "Marketing does it this way" is evidence, not an argument.

### Status

Eight roles per state, because a status hue does different jobs at different contrasts.

- `status-<state>-default` is the hue as a **graphic**: a dot, an icon, a chart series. It meets 3:1 on a card (WCAG 1.4.11).
- `status-<state>-text` is a **label on a normal surface** at 4.5:1.
- `status-<state>-fill` is a **solid** badge or button background, with `status-<state>-on-fill` as its label. On dark it is also the colour edge on large surfaces.
- `status-<state>-subtle` and `-subtle-border` are a **status chip**: `-text` on a pastel with a faint edge of the same hue.
- `status-<state>-surface` and `-border` are a **large status surface**: a callout, banner, or tile.

| State | Text, light | Text, dark | Fill | Label on fill |
| --- | --- | --- | --- | --- |
| success | `#046E31` | `#6FD087` | `#1B8641` | white |
| warning | `#7E5905` | `#E6AC3D` | `#F5AE39` | `#1A1A18` |
| danger | `#BB081F` | `#FF5B5B` | `#DE2F2E` | white |
| info | `#5D5B58` | `#BAB7B3` | `#75726F` | white |

Each colour keeps its hue and chroma, with lightness fitted so text passes on every warm surface and on its own chip. There is no blue: the brand palette does not have one, and info is a warm grey.

**Danger is a true red, separate from the accent.** The accent stays crimson for links and primary buttons; danger shifts toward scarlet so a destructive state never reads as a link. Light reds drift toward coral on dark, so dark danger text sits at the most neutral red that still passes on its chip.

**Large surfaces are two treatments, one per theme.** On light, the surface is a pastel mixed in OKLab from the fill into white (success 12%, warning 22%, danger 10%) with a border at 45%. On dark, a tinted surface cannot get light enough without costing the text on it contrast, so the surface is neutral (the card for callouts, `surface-hover` for tiles inside a card), the border is the inert hairline, and the state is carried by a 3px edge in the fill: on the left for callouts, on top for tiles. Info is neutral in both themes and takes no edge. In every case, body text stays `content-default` and only the icon and bold title take `-text`.

**Chips match the surfaces.** A status chip is the light pastel with an edge at 30% of the fill on light, and a pastel at the dark mix (success 26%, warning 20%, danger 20% into the card) with an edge at 40% on dark. Neutral chips are the hover grey with no edge. Worst chip ratio: 5.21:1 light (info), 4.69:1 dark (danger).

Categorical label colours, for labels with no good or bad meaning, are not tokens yet.

Colour is never the only carrier of state. A status needs a word, an icon, or a position as well, and the status vocabulary itself is a separate open piece of work ([ux#15](https://github.com/siderolabs/ux/issues/15)).

### Borders

Hairlines, not weight. One width, `1px`, and separation comes from the surface ladder rather than from heavy rules.

`border-edge` (3px) is a colour bar, not a border: the status edge on dark callouts and tiles, and the active nav marker. It is never a neutral separator.

`border-subtle` (6%) for internal dividers and table rows, `border-default` (8%) for card and input edges, `border-strong` (14% dark / 16% light) for hover and emphasis, `border-accent` for an active tab underline or a focused input.

These are translucent and well below 3:1 by design. That is allowed: every component they appear on is identifiable without its border. If a boundary is the only thing telling a user a control exists, it needs `border-strong` at minimum and probably needs rethinking.

## Spacing

Seven named steps, all multiples of 4. Pick the role, never the number.

| Step | Value | Use |
| --- | --- | --- |
| `micro` | 4px | Inside a control: icon to label, chip and badge padding |
| `tight` | 8px | Button padding, between tightly related controls |
| `snug` | 12px | Between related elements in a group |
| `compact` | 16px | Dense content: table cells, list rows, toolbars |
| `base` | 24px | The default gutter: card padding, grid gaps |
| `section` | 32px | Between sections of a page |
| `major` | 64px | Page-level separation |

A value that is not on this menu is a design question, not a CSS decision. Bring it to the token repo as an issue rather than writing `padding: 18px`.

2px is deliberately not a step. A component that needs it (a hairline gap in a segmented control, say) builds it in, and should first check whether it does. Values the products use today that the menu drops: 2 goes away, 6 moves to 4 or 8, 10 to 8 or 12, 14 to 12 or 16, 20 to 24.

`compact` is new relative to the scale Omni shipped in August. Density is a feature in infrastructure tooling, screen real estate is not to be wasted, and a menu that jumps 12 to 24 forces dense tables into the wrong step.

## Typography

Manrope for UI and headings. JetBrains Mono as the machine voice: code, identifiers, versions, node names, and uppercase tracked labels.

The scale is dense on purpose. Base is 14px, not 16px, because these are operator consoles where a table row matters more than reading comfort at arm's length.

| Step | Value | Use |
| --- | --- | --- |
| `2xs` | 10px | Tracked uppercase labels only: rail group headings, environment badges |
| `xs` | 11px | The floor for everything else: dense metadata, stat labels, chart axis labels |
| `sm` | 12px | Chips, badges, captions, timestamps |
| `base` | 14px | Body, tables, inputs, nav, buttons |
| `md` | 16px | Card titles |
| `lg` | 20px | Between card titles and page titles; no fixed role yet |
| `xl` | 24px | Page titles, list and detail pages alike; stat figures |
| `2xl` | 30px | Display; not used in the consoles today |

**Nothing a person reads goes below 11px.** 10px is only for uppercase text with tracking, where the capitals and spacing carry it. Chart libraries default their axis labels to 8 or 9px; set them to `xs`.

Every size is on the scale. A 13px or 10.5px value is off the scale the same way an 18px padding is off the spacing menu.

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

The generated stylesheet also colours Mintlify's own components from the roles: the banner (`accent-gradient-fill`), the topbar button (`accent-fill`), the active sidebar item (the marker style above), the footer's "Powered by" line (`content-muted`, where Mintlify used the disabled grey at 3.05:1 light and 3.27:1 dark), and callouts. Callouts map onto the status states: Danger is danger, Warning is warning, Tip and Check are success, Info is info, and Note is neutral like Info with a `content-secondary` icon. Layout stays in the docs repo.

## Deliberate deviations from the reference skin

Three, all for contrast, all verified by `npm run contrast`.

1. **The faint grey becomes disabled-only.** The reference uses `#5A5A58` (dark) and `#8A8A88` (light) for readable secondary text, which is below AA on the surfaces it sits on. Here they are disabled-only, readable secondary text moves up one step to `content-muted`, and the light ramp sits darker than the reference.
2. **The light page well lightens** from `#EDE9E4` to `#F2EDE8`, so accent text passes AA on it.
3. **The status palette is refitted.** The reference's `#57C28A` dot on a white card is 2.2:1 and its `#F0BB67` is 1.8:1. Every status colour keeps its hue and has its lightness fitted to pass on warm surfaces, with deep variants for text and graphics on light.

Of the solid status fills, only warning carries a dark label. The refitted green and red fills are dark enough for white.

## Enforcement

Rules that live only in a document decay. Each product runs the lint preset from the token package in CI.

- `no-raw-color` catches hex and rgb literals anywhere in a file. Applies to every codebase.
- `no-raw-font-size` catches literal font sizes in component code: style objects, chart options, inline style strings and `text-[13px]`. Applies to every codebase.
- `no-off-menu-spacing` requires the named steps instead of numeric spacing.
- `no-primitive-token` catches application code reaching past the semantic layer into a palette ramp.
- The stylelint config covers the same ground for SCSS.
- `npm run contrast` in the token repo fails the build when a role pair drops below its threshold. Exceptions are listed in the script with a reason, not silently skipped.
- `talos-audit` checks a rendered page: type below the floor or off the scale, spacing off the menu, typefaces that are not ours or not self-hosted, and colours outside the active theme. Run it on a migrated page before calling the migration done.

Adopt with a suppressions file rather than a rewrite. Existing violations are recorded once and the count only goes down, so new code is constrained from day one without blocking on a cleanup. Omni's August branch has 1,672 lines of recorded suppressions and that is the intended shape.

## Changing a token

A value you cannot find a role for is a token request, not a local override. Open an issue on the token repo. Changes land as a version bump, and each product picks them up when it updates the dependency, so you can see which product is on which version.

Cross-product visual decisions (a new role, a palette change, a new spacing step) go through Sterling. Product-local anatomy (how Omni lays out its cluster card) does not.
