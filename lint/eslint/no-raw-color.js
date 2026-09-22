// Copyright (c) 2026 Sidero Labs, Inc.

/**
 * Matched against the whole file rather than the AST so that colours in a
 * JSX style prop, a template attribute, a `<style>` block and a script
 * constant are all caught by one pass.
 */
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\d[^)]*\)/g

/** Only these hex lengths are colours; 5 or 7 digits is something else. */
const HEX_LENGTHS = new Set([3, 4, 6, 8])

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow literal colour values outside the token layer, so themes can be re-pointed in one place.',
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        const text = context.sourceCode.getText()

        for (const match of text.matchAll(COLOUR)) {
          const value = match[0]
          if (value.startsWith('#') && !HEX_LENGTHS.has(value.length - 1)) continue

          const start = match.index

          context.report({
            loc: {
              start: context.sourceCode.getLocFromIndex(start),
              end: context.sourceCode.getLocFromIndex(start + value.length),
            },
            message: `"${value}" is a literal colour. Use a semantic token (surface-*, content-*, border-*, accent-*, status-*) so it follows the theme. Multi-colour artwork belongs in components/icons, where this rule is off.`,
          })
        }
      },
    }
  },
}
