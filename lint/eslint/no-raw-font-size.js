// Copyright (c) 2026 Sidero Labs, Inc.

import { TYPE_SCALE, bareUtility, createClassStringRule } from './shared.js'

/**
 * A literal size in a style object (`fontSize: 12`, `fontSize: '0.8rem'`) or
 * a CSS declaration inside a string (`style="font-size: 13px"`).
 *
 * Matched against the whole file rather than the AST, as `no-raw-color` is,
 * because a Vue template's `style` attribute is not a JavaScript string and
 * would otherwise need a second visitor per template shape. The value must be
 * followed by the end of the declaration, so `fontSize: 12 * scale` and
 * `font-size: ${size}px` read as expressions and pass.
 */
const LITERAL_SIZE =
  /(?<![\w-])(fontSize|font-size)['"]?\s*:\s*['"`]?(\d*\.?\d+)(px|rem|em|pt)?['"`]?(?=\s*(?:[,;})\]"'`\n]|!|$))/g

/** `text-[13px]`, `text-[0.8rem]`, `text-[length:13px]`, with or without a line-height modifier. */
const ARBITRARY_SIZE = /^text-\[(?:length:)?(\d*\.?\d+)(px|rem|em|pt)\](?:\/.+)?$/

const FLOOR = TYPE_SCALE.find(({ step }) => step === 'xs')
const LABEL = TYPE_SCALE.find(({ step }) => step === '2xs')

const STEPS = TYPE_SCALE.map(
  ({ step, px }) => `text-${step} (${px}px${step === LABEL.step ? ', tracked uppercase labels only' : ''})`,
)
const SCALE = `${STEPS.slice(0, -1).join(', ')} or ${STEPS.at(-1)}`

/** `em` depends on the parent, so it has no pixel equivalent to compare. */
function toPx(number, unit) {
  if (!unit || unit === 'px') return number
  if (unit === 'pt') return (number * 4) / 3
  if (unit === 'rem') return number * 16
}

/** Names the step a numeric value lands on or between. */
function nearest(number, unit) {
  const px = toPx(number, unit)
  if (px === undefined) return ''

  const value = unit && unit !== 'px' ? `${number}${unit} (${+px.toFixed(2)}px at a 16px root)` : `${px}px`
  const exact = TYPE_SCALE.find((s) => Math.abs(s.px - px) < 0.01)

  if (exact?.step === LABEL.step) return ` ${value} is text-${LABEL.step}, which is for tracked uppercase labels only.`
  if (exact) return ` ${value} is text-${exact.step}.`
  if (px < FLOOR.px) return ` ${value} is below the ${FLOOR.px}px floor; the nearest readable step is text-${FLOOR.step}.`

  const below = TYPE_SCALE.findLast((s) => s.px < px)
  const above = TYPE_SCALE.find((s) => s.px > px)
  if (!above) return ` ${value} is above the scale; the largest step is text-${below.step} (${below.px}px).`

  return ` ${value} sits between text-${below.step} (${below.px}px) and text-${above.step} (${above.px}px).`
}

const DESIGN_QUESTION = 'A size that is not on the scale is a design question.'

const classRule = createClassStringRule((className) => {
  const match = ARBITRARY_SIZE.exec(bareUtility(className))
  if (!match) return

  const [, number, unit] = match

  return `Use a type token instead of "${className}": ${SCALE}.${nearest(+number, unit)} ${DESIGN_QUESTION}`
})

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow literal font sizes in component code, so every size comes from the type scale.',
    },
    schema: [],
  },
  create(context) {
    return {
      ...classRule(context),
      Program() {
        const text = context.sourceCode.getText()

        for (const match of text.matchAll(LITERAL_SIZE)) {
          const [literal, key, number, unit] = match
          if (+number === 0) continue

          // A style object is also how chart libraries take their options,
          // and those render outside CSS where var() does not resolve.
          const fix =
            key === 'fontSize'
              ? `Use 'var(--talos-text-*)': ${SCALE}.${nearest(+number, unit)} Chart and canvas options cannot resolve var(), so read the token at runtime with getComputedStyle(document.documentElement).getPropertyValue('--talos-text-${FLOOR.step}').`
              : `Use var(--talos-text-*) or a text-* utility: ${SCALE}.${nearest(+number, unit)}`

          context.report({
            loc: {
              start: context.sourceCode.getLocFromIndex(match.index),
              end: context.sourceCode.getLocFromIndex(match.index + literal.length),
            },
            message: `"${literal}" is a literal font size. ${fix} ${DESIGN_QUESTION}`,
          })
        }
      },
    }
  },
}
