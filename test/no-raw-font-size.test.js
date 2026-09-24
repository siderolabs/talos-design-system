// Copyright (c) 2026 Sidero Labs, Inc.

import { describe, it } from 'node:test'
import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'

import rule from '../lint/eslint/no-raw-font-size.js'

RuleTester.describe = describe
RuleTester.it = it

const jsx = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
})

const vue = new RuleTester({ languageOptions: { parser: vueParser } })

const error = (pattern) => ({ message: new RegExp(pattern) })

jsx.run('no-raw-font-size (JS and JSX)', rule, {
  valid: [
    `const a = <span style={{ fontSize: 'var(--talos-text-sm)' }} />`,
    `const a = <span style={{ fontSize: 'inherit' }} />`,
    `const a = <span style={{ fontSize: size }} />`,
    `const a = <span style={{ fontSize: 12 * scale }} />`,
    `const a = <span style={{ fontSize: 0 }} />`,
    `const a = <span style={{ fontSize: '100%' }} />`,
    `const a = <span className="text-sm text-[var(--x)]" />`,
    'const css = `font-size: ${size}px;`',
    `const css = 'font-size: var(--talos-text-xs)'`,
    `const a = <span style={{ fontSize: 'var(--talos-type-meta-size)' }} />`,
  ],
  invalid: [
    { code: `const a = <span style={{ fontSize: 9 }} />`, errors: [error('below the 11px floor')] },
    { code: `const a = <span style={{ fontSize: '12px' }} />`, errors: [error('12px is text-sm')] },
    { code: `const a = <span style={{ fontSize: '0.8rem' }} />`, errors: [error('12.8px at a 16px root')] },
    { code: `const a = <span style={{ fontSize: "1.1em" }} />`, errors: [error('"fontSize: "1.1em"" is a literal')] },
    { code: `const a = <span style={{ fontSize: '10px' }} />`, errors: [error('tracked uppercase labels only')] },
    {
      code: `const options = { xaxis: { labels: { style: { fontSize: '8px' } } } }`,
      errors: [error("getPropertyValue\\('--talos-type-annotation-size'\\)")],
    },
    { code: `const a = <div style="font-size: 13px" />`, errors: [error('sits between text-sm \\(12px\\) and text-base \\(14px\\)')] },
    { code: 'const css = `color: red; font-size: 13px !important;`', errors: 1 },
    { code: `const a = <span className="text-[13px] font-medium" />`, errors: [error('"text-\\[13px\\]" is a literal font size\\. Classify the text')] },
    { code: `const a = cn('md:text-[0.8rem]')`, errors: 1 },
    { code: `const a = <span style={{ fontSize: 40 }} />`, errors: [error('above the scale')] },
  ],
})

vue.run('no-raw-font-size (Vue)', rule, {
  valid: [
    `<template><span class="text-sm" :style="{ fontSize: size }">x</span></template>`,
  ],
  invalid: [
    {
      code: `<template><span style="font-size: 13px">x</span></template>`,
      errors: 1,
    },
    {
      code: `<template><span :style="{ fontSize: '9px' }">x</span></template>`,
      errors: 1,
    },
    {
      code: `<template><span class="text-[15px]">x</span></template>`,
      errors: 1,
    },
  ],
})
