# Type roles

A type role names what a piece of text is. Each role resolves to one size, weight, line height and face from the scale, so choosing the role chooses the size.

The question "should this be 12px or 14px?" has no answer you can check. The question "is this a timestamp under a name, or the content of a table cell?" does, and anyone looking at the screen will answer it the same way. That is the whole point of roles: they turn a taste call into a classification, which a reviewer, a new engineer or an agent can make consistently from what is visible on the page.

Roles are defined in `tokens/type-roles.json`. Every field is a reference into the scale, and the build fails if a role brings its own value, so a role can never smuggle an off-scale size back in.

## The roles

| Role | Size / weight | What it is |
| --- | --- | --- |
| `page-title` | 24 / 600 | The one heading that names the page. List and detail pages alike. |
| `section-title` | 16 / 600 | Names a card, panel, modal or section within the page. |
| `stat` | 24 / 600, tabular | A headline number on a stat card or summary tile. |
| `body` | 14 / 400 | The content itself: table cells, form values, paragraphs, list items, page descriptions, empty states. |
| `body-strong` | 14 / 600 | The body text that identifies a row or record: the name in the first column. |
| `control` | 14 / 500 | Text a person clicks: buttons, tabs, nav items, menu items, segmented controls, standalone action links. |
| `label` | 12 / 500 | Names a value next to it: form field labels, the key in a key/value pair. |
| `meta` | 12 / 400 | Supporting text about something else: the email under a name, a timestamp under an event, helper text, counts, pagination summaries, footers. |
| `badge` | 12 / 600 | Text inside a chip, pill or status badge. |
| `overline` | 10 / 600, uppercase, tracked | Groups or captions other content: sidebar group names, stat captions, table column headers. |
| `overline-mono` | 10 / 500 mono, uppercase, tracked | The machine voice as a label: environment badges, a resource kind above a name. |
| `annotation` | 11 / 400 | Text drawn inside a chart or diagram: axis labels, legends, data labels. |
| `mono` | 12 / 400 mono | An identifier standing on its own: IDs, versions, hashes, IPs, paths, role slugs. |
| `code-block` | 12 / 400 mono, relaxed | Multi-line code, config and log output. |

Colour is not part of a role, because it changes with the theme and with state. The usual pairing: titles, `stat` and `body-strong` in `content-emphasis`; `body` and `control` in `content-default`; `label`, `meta`, `overline` and `annotation` in `content-secondary`; status badges in their `status-*-text`.

## Choosing a role

Ask these in order and stop at the first yes. The order matters: a number inside a badge is a badge, not a stat, and a link inside a chart legend is an annotation.

1. **Is it drawn inside a chart or diagram?** `annotation`.
2. **Does it name the page?** `page-title`. **Does it name a card, panel, modal or section?** `section-title`.
3. **Is it a headline number that a tile or card exists to show?** `stat`.
4. **Is it inside a chip, pill or badge?** `badge`.
5. **Can you click it, and is it not part of a sentence?** `control`. A link inside a sentence keeps the sentence's role and only changes colour.
6. **Is it uppercase and tracked, grouping or captioning other content?** `overline`, or `overline-mono` in the machine voice.
7. **Does it name a value that sits beside or below it?** `label`.
8. **Is it multi-line code, config or log output?** `code-block`. **Is it an identifier standing on its own?** `mono`.
9. **Is it about something else next to it, rather than content in its own right?** `meta`.
10. **Otherwise it is content.** `body`, or `body-strong` if it is what identifies the row or record.

## Worked examples

From the Sidero Portal as it shipped in September 2026, and from infrastructure console patterns in general.

**Portal overview**

| Text | Role | Why |
| --- | --- | --- |
| "Overview" | `page-title` | Names the page. |
| "What needs a human today, across every account." | `body` | The page description is content. Secondary colour, body size. |
| "DIRECTORY", "PLATFORM" in the sidebar | `overline` | Uppercase, groups the nav items below it. |
| "Accounts", "Fleet" in the sidebar | `control` | Clickable nav items. |
| "SUPPORT OWED" on a stat card | `overline` | Captions the number. |
| "8" | `stat` | The number the card exists to show. |
| "open · ball with us" | `meta` | About the number beside it. |
| "Oldest open requests" | `section-title` | Names the card. |
| "Open queue →" | `control` | A standalone action link. |
| "REQUEST", "ACCOUNT", "AGE" column headers | `overline` | Uppercase captions for the columns. |
| "Cannot download schematics" | `body-strong` | Identifies the row. |
| "Wayfinder Robotics" in the account column | `body` | Cell content. |
| "normal", "low" severity | `badge` | Inside a pill. |
| "21 days ago" in the age column | `body` | A table cell is content, even when it holds a timestamp. |
| "1 minute ago" under an audit event | `meta` | About the event above it. |
| "DEVELOPMENT" environment marker | `overline-mono` | The machine voice as a label. |
| "© 2026 Sidero Labs, Inc." | `meta` | Footer. |

**Portal account detail**

| Text | Role | Why |
| --- | --- | --- |
| "Accounts / aa8c5b39-…" breadcrumb | `meta`, with the ID in `mono` at the same size | Wayfinding about the page, not the page's name. |
| "Bluewater Hosting" | `page-title` | Names the page, even though it sits in a header card. |
| "active" | `badge` | Inside a status chip. |
| "Not yet a paying customer", "Billing email: finance@…" | `meta` | About the account. |
| "Edit account", "Impersonate" | `control` | Buttons. |
| "Members 2" tab | `control`, with the count in `badge` | The tab is clickable; the count is a chip inside it. |
| "Morgan Tide" in the members table | `body-strong` | Identifies the row. |
| "morgan@bluewater.example" under the name | `meta` | About the person above it. |
| "account-admin" in the role column | `mono` | A role slug is an identifier. |
| "2 members · page 1 of 1" | `meta` | Pagination summary. |
| "Search members" placeholder | `body` | An input's text is body whether it is a value or a placeholder. |

**Infrastructure consoles**

| Text | Role | Why |
| --- | --- | --- |
| Chart axis labels and legends | `annotation` | Inside a chart. Chart libraries default to 8 or 9px; the floor is 11. |
| "CPU", "Memory" captions over utilisation bars | `overline` if uppercase, otherwise `label` | Captions or names the value beside it. |
| Machine and cluster names in list tables | `body-strong` | Identify the row. |
| IP addresses, Talos versions, MAC addresses | `mono` | Identifiers standing on their own. |
| Form field labels in create dialogs | `label` | Name the input below. |

## Cases that look ambiguous

**A timestamp is `body` in a table cell and `meta` under a name.** The test is whether it is content in its own right or text about something next to it. A column called "Age" makes the age content.

**A number is `stat` only when a tile exists to show it.** A count in a table cell is `body`, a count in a tab is `badge`, a count in a sentence is whatever the sentence is.

**Code inside a sentence keeps the sentence's size.** Switch the face to `--talos-font-mono` and leave size and line height alone. Only standalone identifiers take `mono`.

**A detail page's name is a `page-title` wherever it sits.** A header card, a breadcrumb row or a hero band doesn't change what the text is.

**Placeholder text is `body`.** It sits in the input and has to read at the same size as the value that will replace it. Its colour is `content-muted`.

**Avatars, logos and wordmarks have no role.** They are graphics that happen to contain letters, and they size with the component that draws them.

## When nothing fits

Don't pick a size. Pick the closest role, and raise the gap as a design question in the review, naming the text and what makes it different. If the same gap comes up twice, it becomes a new role here, and it gets a size from the existing scale.

## Migrating existing screens

The shipped size is evidence, not the answer. Classify the text, apply the role, and let the size move. The moves that surprise people:

- **13px body goes up to 14, not down to 12.** Most off-scale 13px text in the Portal is content.
- **10.5px uppercase sidebar headings become `overline`,** which is 10px with tracking.
- **11px badges become `badge` at 12.**
- **8 and 9px chart labels become `annotation` at 11.** Set it in the chart library's options from `--talos-type-annotation-size`, read at runtime, rather than as a literal.

## Using roles in code

| Stack | Apply a role |
| --- | --- |
| Tailwind v4 (Omni) | `class="type-meta"`, from `dist/tailwind.css` |
| Sass (Bootstrap hosts) | `@include talos.talos-type(meta);`, from `dist/tokens.scss` |
| Plain CSS | `class="talos-type-meta"`, from `dist/type.css` |
| Chart options and other JS | Read `--talos-type-annotation-size` and friends with `getComputedStyle` |

Every role also exposes its parts as custom properties (`--talos-type-meta-size`, `-weight`, `-leading`, `-tracking`, `-family`) for components that need one field on its own.

Prefer roles to the raw `text-*` sizes in application code. The sizes stay available for the few places a role would be wrong, like a component that scales its own type.
