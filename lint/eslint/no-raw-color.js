// Copyright (c) 2026 Sidero Labs, Inc.

/**
 * Matched against the whole file rather than the AST so that colours in a
 * JSX style prop, a template attribute, a `<style>` block and a script
 * constant are all caught by one pass. A `#` straight after `&` is an HTML
 * character reference (`&#8230;`), not a colour.
 */
const COLOUR = /(?<!&)#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\d[^)]*\)/g

/** Only these hex lengths are colours; 5 or 7 digits is something else. */
const HEX_LENGTHS = new Set([3, 4, 6, 8])

const CSS_COMMENT = /\/\*[\s\S]*?\*\//g

/**
 * The `[start, end)` ranges of every comment in the file, where a colour is
 * prose rather than a value: script comments, Vue template comments, and CSS
 * comments inside a string or a Vue `<style>` block. CSS comments are only
 * looked for inside those bounded spans, so a `/*` in a glob string cannot
 * swallow the rest of the file.
 */
function commentRanges(sourceCode) {
  const ranges = sourceCode.getAllComments().map((comment) => comment.range)

  for (const comment of sourceCode.ast.templateBody?.comments ?? []) ranges.push(comment.range)

  const cssSpans = []
  const collect = (node) => {
    if (!node || typeof node.type !== 'string') return
    if ((node.type === 'Literal' && typeof node.value === 'string') || node.type === 'TemplateElement') {
      cssSpans.push(node.range)
    }
    for (const key of sourceCode.visitorKeys[node.type] ?? []) {
      const child = node[key]
      if (Array.isArray(child)) child.forEach(collect)
      else collect(child)
    }
  }
  collect(sourceCode.ast)

  const fragment = sourceCode.parserServices?.getDocumentFragment?.()
  for (const element of fragment?.children ?? []) {
    if (element.type === 'VElement' && element.name === 'style') {
      for (const child of element.children) cssSpans.push(child.range)
    }
  }

  const text = sourceCode.getText()
  for (const [start, end] of cssSpans) {
    for (const match of text.slice(start, end).matchAll(CSS_COMMENT)) {
      ranges.push([start + match.index, start + match.index + match[0].length])
    }
  }

  return ranges
}

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
        const { sourceCode } = context
        const text = sourceCode.getText()
        const comments = commentRanges(sourceCode)

        for (const match of text.matchAll(COLOUR)) {
          const value = match[0]
          if (value.startsWith('#') && !HEX_LENGTHS.has(value.length - 1)) continue

          const start = match.index
          if (comments.some(([from, to]) => start >= from && start < to)) continue

          context.report({
            loc: {
              start: sourceCode.getLocFromIndex(start),
              end: sourceCode.getLocFromIndex(start + value.length),
            },
            message: `"${value}" is a literal colour. Use a semantic token (surface-*, content-*, border-*, accent-*, status-*) so it follows the theme. Multi-colour artwork belongs in components/icons, where this rule is off.`,
          })
        }
      },
    }
  },
}
