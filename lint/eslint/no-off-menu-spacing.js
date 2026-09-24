// Copyright (c) 2026 Sidero Labs, Inc.

import { bareUtility, createClassStringRule } from './shared.js'

/**
 * Longer prefixes precede their shorter forms so `gap-x` is not read as
 * `gap` with a value of `x`.
 */
const SPACING_UTILITY =
  /^-?(gap-x|gap-y|gap|space-x|space-y|px|py|pt|pb|pl|pr|ps|pe|p|mx|my|mt|mb|ml|mr|ms|me|m)-(.+)$/

const MENU = new Set(['micro', 'tight', 'snug', 'compact', 'base', 'section', 'major'])

/**
 * `0` and `auto` express intent that no named step can, `px` is a hairline
 * rather than a spacing step, and `reverse` is part of `space-x-reverse`.
 */
const OFF_SCALE_BUT_ALLOWED = new Set(['0', 'auto', 'px', 'reverse'])

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the named spacing steps instead of numeric spacing utilities, so density is a system decision rather than a per-component one.',
    },
    schema: [],
  },
  create: createClassStringRule((className) => {
    const match = SPACING_UTILITY.exec(bareUtility(className))
    if (!match) return

    const [, utility, value] = match
    if (MENU.has(value) || OFF_SCALE_BUT_ALLOWED.has(value)) return

    return `Use a named spacing step instead of "${className}": ${utility}-micro (4px), -tight (8px), -snug (12px), -compact (16px), -base (24px), -section (32px) or -major (64px). A value that is not on the menu is a design question.`
  }),
}
