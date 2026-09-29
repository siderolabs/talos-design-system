# Iconography

An icon that carries meaning is a word in a small vocabulary, and a word has to mean the same thing everywhere. This guide covers the icons that carry meaning today: the state of something, the theme choice, and what is selected. Navigation and object icons (a cluster, a machine) are not covered yet.

The shapes are specified, not the files. A product draws them from whatever icon set it already uses. The reference names below are from Heroicons because that set has all of them at the sizes needed; a product on another set picks the matching shape.

## Rules

1. **A shape means one thing.** The circled tick means succeeded, in every product. The bare tick means chosen. Neither stands in for the other.
2. **A state has a shape as well as a colour, and the word stays.** Red and green are the pair most often confused, and they are the pair status leans on hardest. The glyph makes the state readable without its colour and the word makes it readable without the glyph (WCAG 1.4.1). The test: in greyscale, every state on the page still reads.
3. **The glyph names the kind of state, not its colour.** Colour and glyph usually agree. Where a product colours a state for its own reasons (in-progress states in amber, say), the glyph still follows the kind.
4. **A glyph beside its word is hidden from assistive technology** (`aria-hidden`), because the word already says it. A glyph with no word needs an accessible name, and a tooltip alone is not one.
5. **State glyphs don't move.** A column of spinning icons is noise, and motion has to respect `prefers-reduced-motion` anyway. A spinner is for the one thing the reader has just asked for and is waiting on.

## State glyphs

Six kinds. The set is closed: a new state takes the glyph of the kind it belongs to, and a seventh kind is a design question.

| Kind | Means | Shape | Reference | Usual colour |
| --- | --- | --- | --- | --- |
| Succeeded | Done, healthy, ready, applied, true | Circle with a tick | `CheckCircleIcon` | success |
| Failed | Failed, error, not ready, revoked, false | Circle with a cross | `XCircleIcon` | danger |
| Needs attention | Still working, but degraded or at risk, and someone should look | Triangle with an exclamation mark | `ExclamationTriangleIcon` | warning |
| In progress | Changing and expected to settle: booting, scaling, pending, deleting | Two arrows in a circle | `ArrowPathIcon` | warning, or the state's own colour |
| Off | Deliberately inactive: off, disabled, powered off, finished, expired | Circle with a bar | `MinusCircleIcon` | info |
| Unknown | The product can't tell: an unreachable source, a machine not yet connected | Circle with a question mark | `QuestionMarkCircleIcon` | info |

Five of the six are circles, told apart by the mark inside. The triangle is the exception on purpose, so the state that wants a look stands out in a column of circles.

A value can take a state glyph when it is a verdict. True and false in a health column are succeeded and failed, drawn in the neutral colour if the product doesn't want them to read as alarms. The shape still says which is which.

## Where the glyph goes

| Place | Treatment |
| --- | --- |
| Status chip | The glyph at 12px in the chip's `-text`, before the word, with 4px of padding before it and 4px between it and the word. It replaces the 6px dot. |
| State beside a label | The same glyph at 12px, for an inline indicator such as a connection state on a list row. |
| Status count | The number stays neutral, and the glyph sits on its label ([What colour means](style-guide.md#what-colour-means)). |
| Callout or banner | The same shapes at the callout's icon size: danger takes the circled cross, warning the triangle, success the circled tick. Info and note callouts take a circled "i", which is not a state. |

At 12px, use a solid glyph. Outline strokes blur below 16px.

## Where the dot stays

The 6px dot is a marker, not a state glyph. It stays in three places.

- **Levels and rankings**, such as a severity. The word carries the level, and a tick or a cross would read as pass or fail.
- **Chart legends.** The key is a swatch that has to match its segment. The number beside each key is what carries the reading, so the chart is never the only source.
- **Category chips**, in `series-N` ([Series and categories](style-guide.md#series-and-categories)).

## The theme choice

| Choice | Shape | Reference |
| --- | --- | --- |
| Light | Sun | `SunIcon` |
| Dark | Moon | `MoonIcon` |
| System | Monitor | `ComputerDesktopIcon` |

The button shows the current choice, not the theme on screen. The behaviour is in [Choosing a theme](style-guide.md#choosing-a-theme).

## Selection

A bare tick marks the chosen item in a menu or a list, such as the current theme choice. It is never circled, so it can't be read as succeeded, and it sits at the trailing end of the row, where a state glyph never goes.
