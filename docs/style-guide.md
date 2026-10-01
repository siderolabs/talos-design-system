# Talos Design System

**Status:** Draft v0.2 · September 24, 2026 · Owner: Sterling Koch

This is the style guide for every Talos product interface and the documentation site. It carries the values, the rules for using them, and the enforcement. If you are making a UI suggestion (including with an AI tool), point it at this document and the token package rather than at a screenshot of an existing product.

The values are a faithful implementation of the Sidero brand visual guide, as first realised in a reference skin that predates this package. Where this guide departs from that reference, it says so and says why.

## What this covers and what it does not

It covers tokens (colour, spacing, type, radius, elevation), the rules for choosing among them, and the lint that enforces them. It also covers navigation grammar, because that is where the products have drifted furthest apart.

It does not cover components. The consumers span Vue with Tailwind and React with Bootstrap, and a shared component library would mean rewriting one of them. Consistency at the component level comes from the anatomy notes here, implemented natively in each product.

## The two-tier model

Tokens are in two tiers and only one of them is for you.

**Primitives** are raw values: `ink-2`, `red-3`, `cream-0`. They carry no meaning about where they are used, and application code must never reference them. Reaching for a primitive is how a component stops following the theme.

**Semantic roles** name a job: `surface-card`, `content-muted`, `accent-fill`, `status-danger-text`. These are the contract. Every product uses the same role names, so a value change is a token release rather than a refactor, and a theme is a set of role values rather than a rewrite.

There are two themes, dark and light, and one optional variant of dark, [Dim](#dim). Dark is the default. Dark and light define exactly the same roles; a role in one and not the other fails the build. Dim is an overlay on dark and may only re-point roles dark already has.

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
| `surface-scrim` | The backdrop behind a modal or drawer | page 80% | near-black 55% |
| `surface-paper` | Brand cream insert | `#E2D2A8` | `#E2D2A8` |

`surface-subtle` is translucent on purpose: nav items, chips and zebra rows sit on backdrops that vary, and a translucent wash keeps the relationship right wherever it lands.

`surface-scrim` is the one translucent black. It goes behind anything modal so the raised surface reads as the only lit plane while the page stays legible as context. A product does not mix its own: an ad hoc `black/75` here and `page/90` there is how modals end up at three different depths.

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

A disabled run of text takes `content-disabled`. A disabled composite control (a switch, a step in a stepper, a button with an icon and a fill) fades the whole control to 50% opacity instead, because re-pointing three or four roles at once produces a control that looks broken rather than off. The same whole-element fade is how a composite is pushed out of attention for other reasons: the graph nodes that fall outside a filter, a stat block while its data loads. The rule is that opacity fades an element, never a colour. A single colour at reduced alpha is a new colour, and it has to be a role: `surface-subtle` for a wash, `accent-subtle` for a tint, `surface-scrim` behind a modal. `brightness` and other filters are never how colour changes: a hover or pressed state re-points a role (`surface-hover`, `accent-fill-hover`, `accent-fill-active`), and a status chip that is clickable sharpens its edge to `status-<state>-default` on hover rather than brightening.

The rule for choosing: anything a person needs to read, including subtitles, stat labels, field hints and footers, is `content-muted` or louder. The disabled grey is for disabled text and nothing else.

### Dim

Dim is a second dark theme for people who find the near-black planes too stark. Its surfaces are lighter and closer together, so the sidebar and cards read at one depth, and its text stops short of white. The values are Omni's original blue-grey ladder, on the `dusk` ramp.

Dim changes the surfaces and the text and nothing else. Status, series, accent, syntax, highlight, borders and shadows are dark's, so a product needs no Dim-specific component code. The audit holds Dim to dark's rules, pair for pair.

| Role | Dim | Dark, for comparison |
| --- | --- | --- |
| `surface-page` | `#101118` | `#060606` |
| `surface-chrome` | `#13141C` | `#0B0B0B` |
| `surface-card` | `#15161E` | `#1A1A1E` |
| `surface-inset`, `surface-raised` | `#191B24` | `#1E1E22` |
| `surface-hover` | `#1F222E` | `#26262B` |
| `surface-inert` | `#272932` | `#2E2E33` |
| `content-emphasis` | `#E8E8E9` | `#F5F5F4` |
| `content-default` | `#C3C3C7` | `#C8C8C6` |
| `content-secondary` | `#9FA1A6` | `#A8A8A6` |
| `content-muted` | `#878990` | `#8A8A88` |
| `content-disabled` | `#5B5C64` | `#5A5A58` |

Dim is optional. Dark stays the default and the theme the products are designed and reviewed in, so a product can adopt the system without offering Dim, and the fleet looks the same until a reader asks otherwise. How a product offers it is under [Choosing a theme](#choosing-a-theme).

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

**Links in tables and lists keep their text colour.** Accent text marks a link inside running text, where colour is the only thing setting it apart from the words around it. A table or list is different: every row's name opens that row, so the position already says "this opens", and a column of accent turns the most-read column on the page into the loudest one. A name that opens its record keeps the role it would have unlinked, usually `body-strong` in `content-emphasis`. Any other linked cell (an account name in a requests table, a person) stays `body` in `content-default`. On hover the link underlines and takes `accent-text`. A header action that opens a fuller view ("Open queue →") is `control` in `content-default`, with the same hover. Accent text stays correct for a link inside a sentence, in a table cell or anywhere else. `talos-audit` flags accent text standing alone in a table cell.

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

- `status-<state>-default` is the hue as a **graphic**: a dot, a glyph, a progress fill, the edge on a status card. It meets 3:1 on the page, the chrome, the card and its own chip (WCAG 1.4.11), and on light it is as light as that allows, so a graphic is not held to text contrast it doesn't need.
- `status-<state>-chart` is the hue as a **chart segment**, beside a legend or label that carries the number. On light it is lighter than `-default` and holds 2:1 on the card, so a state chart reads as one family with the series. On dark it is `-default`.
- `status-<state>-text` is a **label on a normal surface** at 4.5:1.
- `status-<state>-fill` is a **solid** badge or button background, with `status-<state>-on-fill` as its label. On dark it is also the colour edge on large surfaces.
- `status-<state>-subtle` and `-subtle-border` are a **status chip**: `-text` on a pastel with a faint edge of the same hue.
- `status-<state>-surface` and `-border` are a **large status surface**: a callout, banner, or tile.

| State | Text, light | Graphic, light | Chart, light | Text and graphic, dark | Fill | Label on fill |
| --- | --- | --- | --- | --- | --- | --- |
| success | `#1C7A3D` | `#0A9D49` | `#36A558` | `#6FD087` | `#1B8641` | white |
| warning | `#8A6419` | `#B87C06` | `#EBA42C` | `#E6AC3D` | `#F5AE39` | `#1A1A18` |
| danger | `#CC272E` | `#F14F47` | `#E95048` | `#FF5B5B` | `#DE2F2E` | white |
| info | `#676461` | `#837F7C` | `#96918C` | `#BAB7B3` | `#75726F` | white |

Each colour keeps its hue and chroma, with lightness fitted to the contrast its job needs and no darker. Light text is as light as 4.5:1 on its chip and the page allows. On light, text, graphics and chart segments are separate steps. A light-theme chart drawn in text colours comes out dark and muddy, worst in amber. On dark, the light text colour already sits well as a graphic, so one step does all three.

**Amber tops out at mustard as a graphic on light.** 3:1 against a light background caps its lightness whatever the background, and amber is the hue that suffers most, because it is only vivid when it is light. A white page instead of cream would lift it a little, from `#B87C06` to about `#C68706`, still a mustard. That is why chart segments have their own step: a warning segment beside a legend can be the amber it wants to be. There is no blue: the brand palette does not have one, and info is a warm grey.

**Danger is a true red, separate from the accent.** The accent stays crimson for links and primary buttons; danger shifts toward scarlet so a destructive state never reads as a link. Light reds drift toward coral on dark, so dark danger text sits at the most neutral red that still passes on its chip.

**Large surfaces are two treatments, one per theme.** On light, the surface is a pastel mixed in OKLab from the fill into white (success 12%, warning 22%, danger 10%) with a border at 45% of the fill (92% for warning, see below). On dark, a tinted surface cannot get light enough without costing the text on it contrast, so the surface is neutral (the card for callouts, `surface-hover` for tiles inside a card), the border is the inert hairline, and the state is carried by a 3px edge in the fill: on the left for callouts, on top for tiles. Info is neutral in both themes and takes no edge. In every case, body text stays `content-default`, the bold title takes `-text` and the icon takes `-default`.

**A status edge on a card or row is `-default`, in both themes.** A card that stands for a record (a cluster, an account) can carry its worst state as a 3px edge on the left, beside the chip that names it. Unlike a callout, the card is not a status surface: it stays the card on the card's border, and the edge is a graphic summarising one of the things inside it. So it takes the graphic step. The fill would not do on light, where the warning fill is 1.9:1 on a white card. A card with no state worth flagging keeps `border-strong` on that edge rather than losing it, so a grid of cards stays aligned. Success is usually not worth an edge: if every healthy card is green, the amber one stops standing out.

**Chips match the surfaces.** A status chip is the light pastel with an edge mixed from the fill, and on dark a pastel at the dark mix (success 26%, warning 20%, danger 20% into the card) with an edge mixed into the card. Neutral chips are the hover grey with no edge. Worst chip ratio: 5.21:1 light (info), 4.69:1 dark (danger).

**Edges are fitted to a contrast, not a mix.** A chip's edge holds 1.3:1 against its own pastel and a light surface's border holds 1.5:1 against its surface, and the audit enforces both. A fixed mix leaves amber's edges invisible, because amber is so much lighter than green or scarlet: at the 30% that gives green a clear edge, amber's is 1.05:1. So the mix differs by colour. On light the chip edge is 32% for success, 63% for warning and 30% for danger; on dark it is 46%, 40% and 40%. The mix percentages are recorded on each primitive.

### Series and categories

Eight data colours, `series-1` to `series-8`, for things that have no good or bad meaning: the series in a chart, and the marker on a category chip. They are graphics only. None of them is used as a text colour, fills a chip, or stands in for a status. On dark each reaches 3:1 on every surface charts are drawn on. On light a chart fill is held to 2:1 on the card, under a [contrast exception](#contrast-exceptions) that depends on its reading never being carried by colour alone: every segment has a legend entry or a label, and a ring whose empty part is the reading outlines its track (below). Holding light chart fills to 3:1 forces every hue to a mid-tone, where orange turns brown and gold turns mustard, and the set stops reading as a family.

**Lightness follows the hue.** On light, the eight run at one chroma (0.15) with a lightness that follows each hue's natural weight: magenta deep (OKLCH 0.55), orange, violet and gold light (0.70 to 0.76), blue, teal, green and slate between. Blue is lifted a step above where its weight alone would put it (0.62) because even an 8px marker dot loses much of its perceived chroma, and a deep blue dot reads as black. A palette forced to one lightness looks like paint chips and collapses under colour blindness; one that follows the hues reads as a family, and the lightness spread is what keeps the first six apart for protanopes, deuteranopes and tritanopes.

**Labels on a series fill** (a segment of a stacked bar wide enough to name itself) take `on-series-N` for series N. On dark every series is light and takes the dark label. On light, magenta takes white and the rest take near-black. Every series reaches 4.5:1 with its label, so no drop shadow or outline is needed. A segment too narrow for its label leaves it to the legend.

**Syntax colours are not series on light.** Syntax is text and needs 4.5:1, so it takes deeper steps of the same hues (`categorical.light-text`). Sharing one palette is what made light charts dark: every series was held to text contrast.

| Role | Hue | Dark | Light |
| --- | --- | --- | --- |
| `series-1` | Blue | `#6DADFF` | `#4087DE` |
| `series-2` | Orange | `#FEB98F` | `#E6803B` |
| `series-3` | Teal | `#04A19B` | `#04A19B` |
| `series-4` | Magenta | `#EB88C2` | `#AC4785` |
| `series-5` | Violet | `#D3BDFE` | `#B993FB` |
| `series-6` | Gold | `#A98904` | `#D3AD1B` |
| `series-7` | Green | `#74C16C` | `#4A9C42` |
| `series-8` | Slate | `#C6CBD1` | `#8D9399` |

**Use them in order.** A chart with three series takes 1, 2 and 3, so the same position means the same colour everywhere. The order is what makes the palette work for colour-blind readers: lightness alternates across three levels, so the first six stay apart under protanopia, deuteranopia and tritanopia even where their hues collapse. Seven and eight do not reliably separate from the rest, so a chart past six series labels every one directly rather than relying on a legend. Past eight, fold the tail into `series-8` as "Other". Slate is last and near-neutral for that reason.

**Why these hues.** There is no red, because red is the accent and danger. Blue leads because no status and no accent uses it: the brand has no blue and info is grey, so a blue series cannot be mistaken for a status. Green sits seventh because it is the hue nearest success.

**States are not categories.** A chart whose series are states (healthy against failing, used against over quota) takes the status `-default` graphics instead. A series palette on a state chart turns an alert into decoration, and a status palette on a category chart turns decoration into an alert. A series colour never stands in for success, warning or danger.

The test for which palette a chart takes: **would a reader want to act on one of the segments?** A bar that splits a fleet into "in a cluster", "free" and "pending" is a partition of a whole, and none of those is better than another, so it takes `series-1`, `-2`, `-3` in order. A bar that splits the same fleet into "healthy", "degraded" and "unreachable" is a set of states, and it takes the status `-default` graphics. When one chart mixes both (a state chart with an "other" or "remaining" segment), the neutral remainder is `series-8`, so it stays quiet beside the states.

**Tracks and grids.** A ring or bar fills over `surface-inert`. Where the track's own extent matters, as in a ring whose empty part is the reading, outline it in `border-control`. Axis labels are `content-muted` in the `annotation` type role, and gridlines are `border-subtle`.

**Category chips.** A label with a category but no state is the neutral filterable chip from the table below, with an 8px dot in its `series-N` before the text. The dot carries the category; the chip stays neutral, because the pastel pill means status.

### One colour per state

A state has one colour everywhere it appears. If scaling is amber in a status pill, it is amber in the chart above it, in the glyph beside the count, and in the row's edge. The pill is the reference, because it is where the word sits next to the colour, so a product that has to choose looks at its pill first and draws everything else to match.

Two consequences follow. A chart cannot give two states different colours when their pills share one: scaling up and scaling down are both amber in the pill, so a chart that wants to show both merges them into one segment under a shared label rather than inventing a second amber or borrowing a series colour. The reading is coarser and it is honest; a colour the pill never uses would tell the reader there is a state that does not exist. And a state that reads as an error in one place cannot read as progress in another: a cluster being destroyed on purpose is in progress, so it is info in the pill and info in the chart, not danger in either.

### Syntax

Syntax highlighting has its own roles, `syntax-*`, used by code blocks, editors and diffs in every product. They are text, so each reaches 4.5:1 on the page well, the card, the raised surface, and every `highlight-*` fill (a search match, an added or removed diff line), in both themes. The hues come from the series palette, which keeps code and charts one family, but the roles are separate: a chart never takes a `syntax-*` colour, and code never takes a `series-*` one.

| Role | For | Dark | Light |
| --- | --- | --- | --- |
| `syntax-key` | Mapping keys, properties, tags, attribute names | Blue | Blue |
| `syntax-string` | Quoted strings | Magenta | Magenta |
| `syntax-constant` | Numbers, booleans, null | Orange | Orange |
| `syntax-keyword` | Keywords, YAML anchors and tags | Violet | Violet |
| `syntax-plain` | Unscoped scalars and text | `content-default` | `content-default` |
| `syntax-punctuation` | Brackets, separators, indicators | `content-secondary` | `content-secondary` |
| `syntax-comment` | Comments, in italic | `content-secondary` | `content-secondary` |
| `syntax-invalid` | Parse errors only | `status-danger-text` | `status-danger-text` |

**Green and red are never syntax.** In a diff they mean added and removed, and a token in either would read as a change. The accent stays out as well, so a string cannot be mistaken for a link. Keys take the strongest hue because the key is what a reader scans for in configuration; scalars stay close to body text so the eye lands on keys and on what changed. Comments are the quietest token, but they are `content-secondary` rather than `content-muted`: a comment on a tinted diff line has to stay legible, and the italic already sets it apart.

### Highlights

The `highlight-*` roles are fills that sit behind text which still has to be read, so every syntax token and every `content-*` step reaches 4.5:1 on each of them. There are three: a search match, an added line, and a removed line.

**Search matches.** Matched text, wherever text is searched, is a `highlight-match` fill with a 1px `highlight-match-border` outline. The roles are separate from `syntax-*` because the same treatment is used in tables and lists, not only in code: a match in a machine list looks the same as a match in a config. On dark, any tint lighter than the code surface takes comments below 4.5:1, so the fill is a deep blue that keeps every syntax token and every `content-*` step legible, and the outline is what makes the match findable. The current match, where there is one, adds weight to the outline rather than a second colour. A match never inverts the text or bolds it: a heavier weight changes the line's length and makes the list jump as the query is typed.

**Diff lines.** An added line sits on `highlight-added`, a removed one on `highlight-removed`, and the changed words within a line on `highlight-added-emphasis` and `highlight-removed-emphasis`. These are not the status chip backgrounds. A chip only has to carry its own `-text`; a diff line carries every syntax token, and the quietest of them caps how light the tint can be. On dark that cap is close to the card, so the line tint differs from the card by hue rather than by lightness, and the emphasis fill is the same lightness again at three times the chroma: it reads as more green or more red, not as brighter. The line number and the `+` or `-` sign take the status `-text`, so the state is carried by more than the tint.

### What colour means

Colour and the pastel pill mean status. Anything that isn't a status loses both. Classify each coloured or chip-shaped element by what it means, not by how it's drawn today, then draw it one way:

| Role | Treatment | Clickable |
| --- | --- | --- |
| Status | Chip: `-subtle` background, `-subtle-border` edge, `-text` label, and the state's glyph in `-text` before the word ([Iconography](iconography.md#state-glyphs)) | Never |
| Status count | The number in `content-emphasis`, with the status glyph moved onto its label (`content-secondary`) | No |
| Value | Plain text in `content-default`, no chip. A coloured word that isn't a state, such as a capacity figure or an ID | No |
| Filterable label | Outlined neutral chip: transparent, `border-strong` edge, `content-default` text, key in `content-secondary` | Yes, filters |
| Category label | The filterable label with an 8px dot in `series-N` before the text | Yes, filters |
| Applied filter | Filled neutral chip (`surface-hover`) with × | Yes, removes |
| Count badge | Small neutral badge: `surface-hover`, `content-default` | No |
| Callout, banner, tile | The large status surface above | No |
| Destructive action | `status-danger-fill`, `status-danger-on-fill` label | Yes |
| Action | Neutral button: `surface-card`, `border-default` edge, `content-default` | Yes |
| Toggle that is on | `accent-fill`, `content-on-accent` label. Something is switched on | Yes |
| Checked checkbox or radio | `accent-fill` box with its edge in the same colour, the tick or dot in `content-on-accent`. Unchecked: transparent with a `border-control` edge | Yes |
| Selected segment | On a `surface-inset` track, a `surface-inert` thumb with a `border-strong` ring and a `content-emphasis` label; unselected segments are `content-muted`. One of several views is showing, nothing is switched on | Yes |
| Inline code | `content-emphasis` on `surface-inset` | No |

A status count is a number whose meaning is a state: "5 need a look", "12 running", "2 firing". Colouring the number itself makes a dashboard of stat cards read as a wall of alerts, and a green or amber figure at display size fails contrast on light. The glyph on the label carries the state; the number stays readable. A number that is a quantity rather than a state (free capacity, allocated cores) is a value.

A status is never a button. If an element changes something when clicked, it's an action or a toggle and takes that treatment, whatever colour it wore before.

**When a status needs an action.** Some states come with something to do about them: mute a finding, acknowledge an alert, retry a failed step. The chip stays a read-only status and the action sits beside it as its own control, named by its verb: a small neutral button ("Mute"), or an item in the row's overflow menu when there are several. Clicking the chip does nothing. The one exception is a chip inside a larger link, such as a card or row that opens its record when clicked anywhere: the card is the control and the chip is part of what it shows. What happens after the action is part of the pattern. A muted or acknowledged item is no longer a status, so it drops its pastel and glyph and becomes a value or a neutral count ("2 muted"), with the reverse action ("Unmute") in the same place the first one was. `talos-audit` flags a chip that is the whole of a button or link.

Colour is never the only carrier of state. Every status takes a glyph from the closed set in [Iconography](iconography.md#state-glyphs) and keeps its word, and the status vocabulary itself is a separate open piece of work ([ux#15](https://github.com/siderolabs/ux/issues/15)).

### Borders

Hairlines, not weight. One width, `1px`, and separation comes from the surface ladder rather than from heavy rules.

`border-edge` (3px) is a colour bar, not a border: the status edge on dark callouts and tiles, the status edge on a card or row in either theme, and the active nav marker. It is never a neutral separator.

`border-subtle` (6%) for internal dividers and table rows, `border-default` (8%) for card and input edges, `border-strong` (14% dark / 16% light) for hover and emphasis, `border-accent` for an active tab underline or a focused input, `border-focus` for the keyboard focus ring where it has to be an outline (see Elevation and focus).

These are translucent and well below 3:1 by design. That is allowed: every component they appear on is identifiable without its border.

`border-control` is the exception, for a control whose edge is the whole affordance: an unchecked checkbox or radio, a switch track, the outline of a chart track. It is white at 36% on dark and black at 44% on light, which reaches 3:1 on every surface in the ladder (WCAG 1.4.11), and the audit enforces it. It is not a heavier card or input border. Inputs are identifiable by their fill, placeholder and label, and keep `border-default`. If a component needs a 3:1 edge and is not one of these, that is a design question.

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

`compact` is new relative to the scales the products shipped before this package. Density is a feature in infrastructure tooling, screen real estate is not to be wasted, and a menu that jumps 12 to 24 forces dense tables into the wrong step.

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

**Nothing a person reads goes below 11px.** 10px is only for uppercase text with tracking, where the capitals and spacing carry it. Chart libraries default their axis labels to 8 or 9px; set them to the `annotation` role, 11px.

Every size is on the scale. A 13px or 10.5px value is off the scale the same way an 18px padding is off the spacing menu.

Application code picks a **type role** rather than a size. A role names what the text is (`body`, `meta`, `label`, `overline`, `annotation` and nine others) and resolves to one size, weight, line height and face. [Type roles](type-roles.md) has the full set, the decision order, and worked examples.

Weights are 400/500/600/700. Line height is `tight` 1.25 for headings, `base` 1.5 for body and tables, `relaxed` 1.65 for prose.

Both faces ship with the token package as woff2 and are served by the product, never fetched from Google at runtime. A product that loads its type from a CDN loses it in an air-gapped install, and loses it quietly: the page falls back to a system font and still works, so the report never comes.

## Elevation and focus

`shadow-card`, `shadow-dropdown`, `shadow-modal`. Elevation is carried by the surface ladder first; shadows are a secondary cue, deeper in dark mode because brightness alone cannot convey lift on a near-black canvas.

`shadow-focus` is the focus ring. It is never removed without a replacement, and `outline: none` without one is a defect. The ring is applied on `:focus-visible`, not `:focus`, so a mouse click does not draw it, and it is applied once, in a base rule, rather than per component: a product that suppresses the browser outline on a component then has to remember to draw the ring there too, and the places it forgets are the ones nobody tabs through while developing. Where a component already carries a `ring` or `shadow` (a selected segment, a raised card), the focus ring is drawn with `outline` in the same colour and offset instead, so the two do not fight over one property.

## Choosing a theme

Every product ships both themes and lets the reader pick, the same way everywhere, so someone who has set it once in one product finds it in the next.

**Three choices: Light, Dark and System. System is the default.** A first visit follows the operating system, and System keeps following it, so a laptop that switches to dark at sunset takes an open tab with it. Light and Dark are pinned and stay put.

**One control, at the right end of the top bar.** An icon button whose icon shows the current choice, not the theme on screen: a sun for Light, a moon for Dark, a monitor for System ([Iconography](iconography.md#the-theme-choice)). Clicking it opens a menu of the three choices, each with its icon and its name, the current one checked. The button's accessible name carries the choice ("Theme: System"), because the icon alone says nothing to a screen reader. A two-state toggle is not this control. It has no way to say "follow the system", so a reader who flips it once has lost System for good.

**Dim, where a product offers it, is a fourth choice** between Dark and System: Light, Dark, Dim, System. It is only ever chosen, never resolved: System follows the operating system to Light or Dark and nothing else. Dark then takes a solid moon and Dim the outline moon, so the two stay apart in the menu and on the button.

**The choice belongs to the browser, not the account.** It is kept in local storage. The same person signs in from a bright office and from a dark operations room, and the right theme follows the screen rather than the login.

**The page never flashes the wrong theme.** The choice is applied before first paint and on the root element, so a light-mode reader never sees a dark frame while the app loads, and menus and dialogs rendered outside the app's own tree take the theme with everything else. The mechanics are in the [integration guide](integration.md#choosing-a-theme).

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
- `talos-audit` checks a rendered page: type below the floor or off the scale, spacing off the menu, typefaces that are not ours or not self-hosted, colours outside the active theme, status chips that are buttons or links, and accent text standing alone in a table cell. Run it on a migrated page, in every theme the product offers, before calling the migration done. A clean run is necessary, not sufficient: it sees colours and sizes, not whether the right role was chosen for each element, so a bold value or a proportional ID passes.

### Contrast exceptions

The floors are 4.5:1 for text and 3:1 for graphics (WCAG 1.4.3 and 1.4.11). These are the only places the build accepts less, each printed with its reason on every run. A product may not add to this list; a new exception is a change to this repository.

| Exception | What it allows | Why, and the condition it depends on |
| --- | --- | --- |
| Chart fills on light | Series fills and `status-*-chart` segments hold 2:1 on the card, not 3:1. Category marker dots on the page are not enforced. | 1.4.11 covers graphics required to understand the content. A segment always has a legend entry or label carrying its value, and a marker always sits beside its word, so the colour is never the only way to read it. A chart that relies on colour alone (no legend, no labels, colour-coded points) is not covered and uses 3:1. Dark is not covered. |
| Disabled text | `content-disabled` below 4.5:1. | 1.4.3 exempts disabled controls. Disabled state is also carried by something other than colour. |
| Text on hover | `content-muted` and `status-*-text` on `surface-hover`, at 4.1 to 4.3:1 on light. | Hover is a transient backdrop under the pointer. The same text meets 4.5:1 at rest. |
| Primary button hover | The label on `accent-fill-hover` at about 4.0:1 over light surfaces. | Transient, and settled in design review; the label meets 4.5:1 at rest. |
| Banner gradient ends | White text on the logo-colour ends of the banner gradient. | Text sits on the solid band from 30% to 70%, which is enforced as `accent-fill`. Open for narrow viewports, where text can reach the ends. |

Decorative edges (hairline borders, a chip's edge, a light status surface's border) are not exceptions: WCAG sets no floor for them. They are reported, and chip and surface edges are held to a visibility floor so the three state colours stay at parity.

Adopt with a suppressions file rather than a rewrite. Existing violations are recorded once and the count only goes down, so new code is constrained from day one without blocking on a cleanup. A first baseline of well over a thousand lines is normal and is the intended shape.

## Changing a token

A value you cannot find a role for is a token request, not a local override. Open an issue on the token repo. Changes land as a version bump, and each product picks them up when it updates the dependency, so you can see which product is on which version.

Cross-product visual decisions (a new role, a palette change, a new spacing step) go through Sterling. Product-local anatomy (how one product lays out one of its cards) does not.
