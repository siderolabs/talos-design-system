// Copyright (c) 2026 Sidero Labs, Inc.
//
// WCAG contrast audit over the semantic token pairs the UI actually produces.
//
// Checking a palette in isolation proves nothing: what matters is which text
// role lands on which surface role. This walks those combinations for both
// themes, composites translucent values over their backdrop first, and fails
// the build on a regression. Known, reasoned exceptions live in EXCEPTIONS
// rather than being silently skipped.
//
// Run: npm run contrast

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(ROOT, 'dist', 'tokens.json'), 'utf8'))

const AA_TEXT = 4.5 // WCAG 2.1 1.4.3, text below 18px (or below 14px bold)
const AA_LARGE = 3.0 // 1.4.3 for large text, and 1.4.11 for UI component boundaries
// A coloured chip's edge and a light status surface's border are decorative, so
// WCAG sets no floor. These keep the three colours at parity: amber is so light
// that its edges vanished at the same mix as green and scarlet.
const CHIP_EDGE = 1.3
const SURFACE_EDGE = 1.5
// Floor for chart fills on light, under the 'chart fills on light' exception.
const CHART_FILL = 2.0

// ------------------------------------------------------------------ colour

function parse(input) {
  const value = input.trim()

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value)
  if (hex) {
    let digits = hex[1]
    if (digits.length === 3 || digits.length === 4) digits = [...digits].map((d) => d + d).join('')
    const n = parseInt(digits.slice(0, 6), 16)
    const alpha = digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: alpha }
  }

  const fn = /^rgba?\(([^)]+)\)$/i.exec(value)
  if (fn) {
    const parts = fn[1].split(/[,/]/).map((p) => parseFloat(p))
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 }
  }

  throw new Error(`Cannot parse colour: ${input}`)
}

/** Flattens a translucent colour onto an opaque backdrop. */
const over = (fg, bg) =>
  fg.a >= 1
    ? fg
    : { r: fg.a * fg.r + (1 - fg.a) * bg.r, g: fg.a * fg.g + (1 - fg.a) * bg.g, b: fg.a * fg.b + (1 - fg.a) * bg.b, a: 1 }

/**
 * Composites a translucent token onto an opaque one and returns it as a
 * colour string, so tint-on-surface stacks (a tonal chip over a card) can be
 * measured as what the eye actually receives.
 */
function flatten(foreground, background) {
  const { r, g, b } = over(parse(foreground), parse(background))
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

function luminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(foreground, background) {
  const bg = parse(background)
  const fg = over(parse(foreground), bg)
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

// ------------------------------------------------------------------ checks

const TEXT_ON_SURFACE = ['emphasis', 'default', 'secondary', 'muted']
const SURFACES = ['page', 'chrome', 'card', 'inset', 'raised', 'hover']
const STATUSES = ['success', 'warning', 'danger', 'info']
const SYNTAX = ['plain', 'key', 'string', 'constant', 'keyword', 'punctuation', 'comment', 'invalid']

/**
 * Pairs that are expected to fail and why. Each entry is a decision, not a
 * waiver: if one of these stops being true the entry should come out.
 */
const EXCEPTIONS = {
  'content-disabled on any surface':
    'WCAG 1.4.3 exempts disabled controls. Disabled state must also be conveyed by something other than colour.',
  'content-muted on surface-hover':
    'The muted step is set by the text scale rule to pass on the page well, chrome, card and inset. Hover is a transient backdrop under a pointer, and muted text on it lands at about 4.3:1. Pending a decision on whether hover must carry muted text at AA.',
  'primary button hover':
    'Hover is the accent fill at 90%, as settled in the September design review, so the resting 4.50:1 drops to about 4.0:1 over light surfaces while the pointer is over the button. Over dark surfaces it rises to 5.2:1. The label is readable at rest and the change is transient.',
  'banner gradient ends':
    'The banner gradient ends in the logo colours, which do not carry white text. The text sits on the solid accent band from 30% to 70%, which is measured as accent-fill. Pending a decision on narrow viewports, where banner text can reach the ends.',
  'chart fills on light':
    'Series fills and status chart segments on light are held to 2:1 on the card instead of 3:1, and category marker dots are reported only. WCAG 1.4.11 covers graphics required to understand the content; these never are, because every segment has a legend entry or label carrying its value and every marker sits beside its word. At 3:1 on white, orange, gold, violet and amber can only be mid-tones. A chart whose colour is the only way to read it is not covered and must meet 3:1. Dark is not covered and meets 3:1 everywhere.',
}

function checks(theme) {
  const t = (name) => {
    const token = tokens.semantic[theme][name]
    if (!token) throw new Error(`Missing token ${name} in ${theme}`)
    return token.value
  }

  const p = (name) => {
    const token = tokens.primitive[name]
    if (!token) throw new Error(`Missing primitive ${name}`)
    return token.value
  }

  const rows = []
  const add = (label, fg, bg, required, note, standard) => rows.push({ label, fg, bg, required, note, standard })
  const chart = theme === 'light' ? [CHART_FILL, 'chart fills on light', AA_LARGE] : [AA_LARGE]

  for (const surface of SURFACES) {
    for (const role of TEXT_ON_SURFACE) {
      const note = role === 'muted' && surface === 'hover' ? 'content-muted on surface-hover' : undefined
      add(`content-${role} on surface-${surface}`, t(`content-${role}`), t(`surface-${surface}`), AA_TEXT, note)
    }
    add(
      `content-disabled on surface-${surface}`,
      t('content-disabled'),
      t(`surface-${surface}`),
      AA_TEXT,
      'content-disabled on any surface',
    )
  }

  // Accent text has its own token precisely because the brand red does not
  // reach AA as body text. Both are checked so a future edit cannot quietly
  // point accent-text back at the raw brand value.
  for (const surface of ['page', 'card', 'chrome']) {
    add(`accent-text on surface-${surface}`, t('accent-text'), t(`surface-${surface}`), AA_TEXT)
    add(`accent-default on surface-${surface}`, t('accent-default'), t(`surface-${surface}`), AA_LARGE)
  }

  // Every state of the primary button, not just the resting one. A label that
  // passes at rest and fails on hover is the failure mode the reference skin's
  // own success-contrast remediation was written to catch.
  for (const state of ['fill', 'fill-active']) {
    add(`content-on-accent on accent-${state}`, t('content-on-accent'), t(`accent-${state}`), AA_TEXT)
  }
  for (const surface of ['card', 'chrome']) {
    add(
      `content-on-accent on accent-fill-hover over surface-${surface}`,
      t('content-on-accent'),
      flatten(t('accent-fill-hover'), t(`surface-${surface}`)),
      AA_TEXT,
      'primary button hover',
    )
  }

  // A gradient is only as legible as its worst stop, and the worst stop is not
  // the one a designer is looking at. The fill gradient's middle band is the
  // accent fill, already enforced above. Its ends are the logo colours and are
  // measured against white under a documented exception, so the gap stays
  // visible. The display gradient carries nothing and is reported only.
  for (const stop of [1, 3]) {
    add(
      `content-on-accent on gradient-fill end (display-${stop})`,
      t('content-on-accent'),
      p(`gradient-display-${stop}`),
      AA_TEXT,
      'banner gradient ends',
    )
  }
  for (const stop of [1, 2, 3]) {
    add(
      `content-on-accent on gradient-display-${stop}`,
      t('content-on-accent'),
      p(`gradient-display-${stop}`),
      0,
      'informational',
    )
  }

  for (const status of STATUSES) {
    add(`status-${status}-text on surface-card`, t(`status-${status}-text`), t('surface-card'), AA_TEXT)
    add(`status-${status}-text on surface-page`, t(`status-${status}-text`), t('surface-page'), AA_TEXT)
    add(
      `status-${status}-on-fill on status-${status}-fill`,
      t(`status-${status}-on-fill`),
      t(`status-${status}-fill`),
      AA_TEXT,
    )
    // A status dot, a glyph beside neutral text or a chart segment is a
    // meaningful graphic: WCAG 1.4.11, on every surface one can sit on.
    for (const surface of ['page', 'chrome', 'card']) {
      add(`status-${status}-default on surface-${surface}`, t(`status-${status}-default`), t(`surface-${surface}`), AA_LARGE)
    }
    // The glyph inside a chip is drawn in `default` over the chip's pastel.
    add(
      `status-${status}-default on status-${status}-subtle (chip glyph)`,
      t(`status-${status}-default`),
      flatten(t(`status-${status}-subtle`), t('surface-card')),
      AA_LARGE,
    )
    add(`status-${status}-chart on surface-card`, t(`status-${status}-chart`), t('surface-card'), ...chart)
    // Status text stands on its own on ordinary surfaces too. Hover is a
    // transient state and is reported, as content-muted on hover is waived.
    for (const surface of ['page', 'chrome', 'card', 'inset']) {
      add(`status-${status}-text on surface-${surface}`, t(`status-${status}-text`), t(`surface-${surface}`), AA_TEXT)
    }
    add(`status-${status}-text on surface-hover`, t(`status-${status}-text`), t('surface-hover'), 0, 'informational')
    // Status chips put `text` on `subtle` over a card.
    add(
      `status-${status}-text on status-${status}-subtle`,
      t(`status-${status}-text`),
      flatten(t(`status-${status}-subtle`), t('surface-card')),
      AA_TEXT,
    )
    // Large status surfaces (callouts, banners, tiles): the title takes
    // `text`, the icon `default`, the body stays content-default, and a title set in
    // content-emphasis (info and note) must hold as well.
    if (status !== 'info') {
      add(
        `status-${status}-subtle-border on status-${status}-subtle`,
        flatten(t(`status-${status}-subtle-border`), t('surface-card')),
        flatten(t(`status-${status}-subtle`), t('surface-card')),
        CHIP_EDGE,
      )
    }
    const surface = t(`status-${status}-surface`)
    if (theme === 'light' && status !== 'info') {
      add(`status-${status}-border on status-${status}-surface`, t(`status-${status}-border`), surface, SURFACE_EDGE)
    }
    add(`status-${status}-text on status-${status}-surface`, t(`status-${status}-text`), surface, AA_TEXT)
    add(`content-default on status-${status}-surface`, t('content-default'), surface, AA_TEXT)
    add(`content-emphasis on status-${status}-surface`, t('content-emphasis'), surface, AA_TEXT)
    // Tiles inside a card sit on surface-hover in dark, so the title is
    // measured there too.
    if (theme === 'dark') add(`status-${status}-text on surface-hover (tile)`, t(`status-${status}-text`), t('surface-hover'), AA_TEXT)
    // The dark colour edge and the chip edge are graphics next to the surface;
    // reported so the number is known.
    if (theme === 'dark') add(`status-${status}-fill (edge) on surface-card`, t(`status-${status}-fill`), t('surface-card'), 0, 'informational')
  }
  // The note callout's icon is content-secondary on the neutral surface.
  add('content-secondary on status-info-surface (note icon)', t('content-secondary'), t('status-info-surface'), AA_TEXT)

  // Hairlines are brand-mandated and will not reach 3:1. Reported so the
  // number is known, never enforced: borders here are decorative, and every
  // component they appear on is identifiable without them. The one exception
  // is border-control, for controls whose edge is the whole affordance, which
  // is enforced on every surface a control can sit on.
  for (const edge of ['subtle', 'default', 'strong']) {
    add(`border-${edge} on surface-card`, t(`border-${edge}`), t('surface-card'), 0, 'informational')
  }
  add('border-accent on surface-card', t('border-accent'), t('surface-card'), AA_LARGE)
  for (const surface of SURFACES) {
    add(`border-control on surface-${surface}`, t('border-control'), t(`surface-${surface}`), AA_LARGE)
  }

  // Checked and selected controls. A checked checkbox is the accent fill with
  // an on-accent tick; the fill must read against the card and the tick
  // against the fill, both as graphics. A selected segment is emphasis text
  // on the inert thumb.
  for (const surface of ['page', 'card', 'raised']) {
    add(`accent-fill (checked) on surface-${surface}`, t('accent-fill'), t(`surface-${surface}`), AA_LARGE)
  }
  add('content-on-accent (tick) on accent-fill', t('content-on-accent'), t('accent-fill'), AA_LARGE)
  add('content-emphasis on surface-inert (selected segment)', t('content-emphasis'), t('surface-inert'), AA_TEXT)

  // Series are chart fills, measured on the card charts are drawn on and on
  // the page category markers sit on. Light is under the 'chart fills on
  // light' exception. The inert track a bar fills is reported only: a segment
  // is always named by its label or legend, and a ring whose empty part is the
  // reading outlines its track in border-control.
  for (let n = 1; n <= 8; n += 1) {
    add(`series-${n} on surface-card`, t(`series-${n}`), t('surface-card'), ...chart)
    if (theme === 'light') add(`series-${n} on surface-page (marker)`, t(`series-${n}`), t('surface-page'), 0, 'informational')
    else add(`series-${n} on surface-page (marker)`, t(`series-${n}`), t('surface-page'), AA_LARGE)
    add(`series-${n} on surface-inert (track)`, t(`series-${n}`), t('surface-inert'), 0, 'informational')
    add(`on-series-${n} on series-${n} (segment label)`, t(`on-series-${n}`), t(`series-${n}`), AA_TEXT)
  }

  // Syntax colours are text, measured on the surfaces code sits on and on the
  // search-match fill. The match outline is the graphic that makes a match
  // findable, so it carries the 3:1.
  for (const token of SYNTAX) {
    for (const surface of ['page', 'card', 'raised']) {
      add(`syntax-${token} on surface-${surface}`, t(`syntax-${token}`), t(`surface-${surface}`), AA_TEXT)
    }
    add(`syntax-${token} on highlight-match`, t(`syntax-${token}`), t('highlight-match'), AA_TEXT)
    // Diff lines and the changed words within them are tinted, and the code
    // on them still has to read.
    for (const fill of ['added', 'added-emphasis', 'removed', 'removed-emphasis']) {
      add(`syntax-${token} on highlight-${fill}`, t(`syntax-${token}`), t(`highlight-${fill}`), AA_TEXT)
    }
  }
  // The same fill sits behind matched text in tables and lists, so body text
  // has to pass on it too.
  for (const role of ['emphasis', 'default', 'secondary', 'muted']) {
    add(`content-${role} on highlight-match`, t(`content-${role}`), t('highlight-match'), AA_TEXT)
  }
  for (const surface of ['page', 'card', 'raised']) {
    add(`highlight-match-border on surface-${surface}`, t('highlight-match-border'), t(`surface-${surface}`), AA_LARGE)
  }

  return rows
}

// ------------------------------------------------------------------ report

let failures = 0
let waived = 0
let excepted = 0

for (const theme of ['dark', 'light']) {
  console.log(`\n${theme.toUpperCase()}\n${'='.repeat(60)}`)

  for (const row of checks(theme)) {
    const value = ratio(row.fg, row.bg)
    const passed = value >= row.required
    const exempt = row.note && (row.note === 'informational' || row.note in EXCEPTIONS)

    let mark = '  ok  '
    if (row.required === 0) mark = ' info '
    else if (passed && row.standard && value < row.standard) {
      mark = 'except'
      excepted += 1
    } else if (!passed && exempt) {
      mark = 'waived'
      waived += 1
    } else if (!passed) {
      mark = ' FAIL '
      failures += 1
    }

    const target = row.required
      ? `needs ${row.required.toFixed(1)}${row.standard ? `, not ${row.standard.toFixed(1)} (${row.note})` : ''}`
      : ''
    console.log(`[${mark}] ${value.toFixed(2).padStart(5)}:1  ${row.label.padEnd(46)} ${target}`)
  }
}

console.log(`\n${'='.repeat(60)}`)
if (Object.keys(EXCEPTIONS).length) {
  console.log('Documented exceptions:')
  for (const [pair, reason] of Object.entries(EXCEPTIONS)) console.log(`  ${pair}\n    ${reason}`)
}
console.log(`\n${failures} failing, ${waived} waived and ${excepted} passing a lowered floor, each by a documented exception.`)

process.exit(failures ? 1 : 0)
