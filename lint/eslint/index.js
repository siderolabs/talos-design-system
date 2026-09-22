// Copyright (c) 2026 Sidero Labs, Inc.

import noOffMenuSpacing from './no-off-menu-spacing.js'
import noPrimitiveToken from './no-primitive-token.js'
import noRawColor from './no-raw-color.js'

/**
 * Keeps the design system honest: components describe a role and the token
 * layer decides what it looks like.
 *
 * Adopt with a suppressions file rather than a repo-wide rewrite. Existing
 * violations are recorded once and the count only goes down, so the rules
 * constrain new code from day one without blocking on a cleanup.
 *
 * `no-raw-color` applies to any codebase. `no-off-menu-spacing` and
 * `no-primitive-token` read utility class names, so they are for products on
 * Tailwind; SCSS consumers get the equivalent from the stylelint config.
 */
export const designSystem = {
  rules: {
    'no-off-menu-spacing': noOffMenuSpacing,
    'no-primitive-token': noPrimitiveToken,
    'no-raw-color': noRawColor,
  },
}

export default designSystem
