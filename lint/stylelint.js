// Copyright (c) 2026 Sidero Labs, Inc.
//
// Stylelint config for SCSS and CSS consumers (Bootstrap-based UIs). The
// eslint preset covers class names and inline styles in components; this
// covers the stylesheet half, where most of a Sass codebase's raw values live.
//
// Usage in the host repo's stylelint config:
//
//   import talos from '@siderolabs/talos-design-system/stylelint'
//   export default { extends: [talos] }
//
// Point `ignoreFiles` at the generated token files: they are the one place
// literals are correct.

const SPACING_PROPERTIES = [
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-block', 'margin-inline',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-block', 'padding-inline',
  'gap', 'row-gap', 'column-gap',
]

/**
 * Anything that is not a named step, matched as a disallow pattern so the
 * rule can be expressed per property. `0`, `auto`, keywords and percentages
 * express intent no named step can, and `1px` is a hairline rather than a
 * spacing value.
 */
const OFF_MENU_SPACING =
  '/^(?!(0|auto|inherit|initial|unset|revert|1px|-?[\\d.]+%|var\\(--talos-space-|calc\\()).+/'

export default {
  ignoreFiles: ['**/dist/**', '**/node_modules/**', '**/*tokens*.scss', '**/*tokens*.css'],
  rules: {
    // Colour has to come from the token layer or the theme cannot switch.
    'declaration-property-value-disallowed-list': {
      '/color$/': ['/^#/', '/^rgba?\\(/', '/^hsla?\\(/'],
      '/^background/': ['/^#/', '/^rgba?\\(/', '/^hsla?\\(/'],
      '/^border/': ['/#[0-9a-fA-F]{3,8}/'],
      '/^box-shadow/': ['/#[0-9a-fA-F]{3,8}/'],
      ...Object.fromEntries(SPACING_PROPERTIES.map((property) => [property, [OFF_MENU_SPACING]])),
    },

    // Font stacks belong to --talos-font-sans / --talos-font-mono.
    'declaration-property-value-allowed-list': {
      'font-family': ['/^var\\(--talos-font-(sans|mono)\\)$/', 'inherit'],
    },

    // A hex anywhere else (gradients, filters, SVG fills in CSS) is still a
    // theme leak, so catch it with a blanket pattern.
    'color-no-hex': true,

    'declaration-property-unit-allowed-list': {
      'font-size': [],
    },
  },
}
