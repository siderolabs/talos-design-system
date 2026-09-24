// Copyright (c) 2026 Sidero Labs, Inc.

import { bareUtility, createClassStringRule } from './shared.js'

const COLOUR_UTILITY =
  /^(bg|text|border-[trblxyse]|border|ring-offset|ring|fill|stroke|from|to|via|divide|outline|shadow|decoration|accent|caret|placeholder)-(.+)$/

/**
 * The shared palette ramps, plus the ramps Omni shipped before adopting the
 * shared set, so a migration in progress is still guarded.
 */
const PRIMITIVE =
  /^(ink-\d+|cream-\d+|red-\d+|green-\d+|amber-\d+|scarlet-\d+|stone-\d+|paper|gradient-(?:display|fill)-\d+|naturals-n\d+|primary-p\d+|green-g\d+|red-r(?:\d+|logo)|yellow-y\d+|blue-b\d+)$/

/**
 * Each ramp maps to the semantic roles that replace it. The hint is
 * deliberately a short list rather than a single answer, because picking
 * between `surface-card` and `content-default` is a judgement about role that
 * the rule cannot make.
 */
const SUGGESTION = {
  ink: 'surface-* for backgrounds, content-* for text and icons, border-* for edges',
  cream: 'surface-* for backgrounds, content-* for text and icons, border-* for edges',
  naturals: 'surface-* for backgrounds, content-* for text and icons, border-* for edges',
  red: 'accent-default, accent-text, accent-fill or accent-subtle',
  primary: 'accent-default, accent-text, accent-fill or accent-subtle',
  green: 'status-success-*: default, text, fill, subtle for a chip, surface for a callout or tile',
  scarlet: 'status-danger-*: default, text, fill, subtle for a chip, surface for a callout or tile',
  stone: 'status-info-default, status-info-text or status-info-fill',
  amber: 'status-warning-*: default, text, fill, subtle for a chip, surface for a callout or tile',
  yellow: 'status-warning-default, status-warning-text or status-warning-subtle',
  blue: 'status-info-default or status-info-text',
  paper: 'surface-paper',
  gradient: 'accent-gradient for a mark or rule, accent-gradient-fill for a surface carrying text. A gradient stop is never a flat colour.',
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require semantic colour tokens in application code rather than the raw palette primitives.',
    },
    schema: [],
  },
  create: createClassStringRule((className) => {
    const match = COLOUR_UTILITY.exec(bareUtility(className))
    if (!match) return

    const [, utility, value] = match
    if (!PRIMITIVE.test(value)) return

    const ramp = value.split('-')[0]

    return `"${className}" reaches past the semantic layer to a palette primitive, so it will not follow a theme change. Use ${utility}- with ${SUGGESTION[ramp] ?? 'a semantic token'}.`
  }),
}
