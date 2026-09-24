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
  const add = (label, fg, bg, required, note) => rows.push({ label, fg, bg, required, note })

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
    // A status dot or chart series is a meaningful graphic: WCAG 1.4.11.
    add(`status-${status}-default on surface-card`, t(`status-${status}-default`), t('surface-card'), AA_LARGE)
    // Status chips put `text` on `subtle` over a card.
    add(
      `status-${status}-text on status-${status}-subtle`,
      t(`status-${status}-text`),
      flatten(t(`status-${status}-subtle`), t('surface-card')),
      AA_TEXT,
    )
    // Large status surfaces (callouts, banners, tiles): the icon and title
    // take `text`, the body stays content-default, and a title set in
    // content-emphasis (info and note) must hold as well.
    const surface = t(`status-${status}-surface`)
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
  // component they appear on is identifiable without them.
  for (const edge of ['subtle', 'default', 'strong']) {
    add(`border-${edge} on surface-card`, t(`border-${edge}`), t('surface-card'), 0, 'informational')
  }
  add('border-accent on surface-card', t('border-accent'), t('surface-card'), AA_LARGE)

  return rows
}

// ------------------------------------------------------------------ report

let failures = 0
let waived = 0

for (const theme of ['dark', 'light']) {
  console.log(`\n${theme.toUpperCase()}\n${'='.repeat(60)}`)

  for (const row of checks(theme)) {
    const value = ratio(row.fg, row.bg)
    const passed = value >= row.required
    const exempt = row.note && (row.note === 'informational' || row.note in EXCEPTIONS)

    let mark = '  ok  '
    if (row.required === 0) mark = ' info '
    else if (!passed && exempt) {
      mark = 'waived'
      waived += 1
    } else if (!passed) {
      mark = ' FAIL '
      failures += 1
    }

    const target = row.required ? `needs ${row.required.toFixed(1)}` : ''
    console.log(`[${mark}] ${value.toFixed(2).padStart(5)}:1  ${row.label.padEnd(46)} ${target}`)
  }
}

console.log(`\n${'='.repeat(60)}`)
if (Object.keys(EXCEPTIONS).length) {
  console.log('Documented exceptions:')
  for (const [pair, reason] of Object.entries(EXCEPTIONS)) console.log(`  ${pair}\n    ${reason}`)
}
console.log(`\n${failures} failing, ${waived} waived by a documented exception.`)

process.exit(failures ? 1 : 0)
