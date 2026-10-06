// Copyright (c) 2026 Sidero Labs, Inc.

import { describe, it } from 'node:test'
import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'

import rule from '../lint/eslint/no-raw-color.js'

RuleTester.describe = describe
RuleTester.it = it

const jsx = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
})

const vue = new RuleTester({ languageOptions: { parser: vueParser } })

jsx.run('no-raw-color (JS and JSX)', rule, {
  valid: [
    `const a = <span style={{ color: 'var(--talos-content-default)' }} />`,
    `// was #fff before the theme\nconst a = 1`,
    `/* rgba(0, 0, 0, 0.5) */ const a = 1`,
    `const a = <p>{/* #abcdef */}Loading&#8230;</p>`,
    `const a = <p>&#8230; &#128;</p>`,
    'const css = `/* #fff */ color: var(--talos-content-default);`',
    `const glob = 'src/**/*.ts'; const b = 'x */'`,
    `const issue = '#12345'`,
  ],
  invalid: [
    { code: `const a = <span style={{ color: '#fff' }} />`, errors: 1 },
    { code: `const a = <span style={{ color: 'rgb(0, 0, 0)' }} />`, errors: 1 },
    { code: `// #fff\nconst a = '#000'`, errors: 1 },
    { code: 'const css = `/* note */ color: #abcdef;`', errors: 1 },
    { code: `const glob = 'src/**/*.ts'; const c = '#fff'`, errors: 1 },
  ],
})

vue.run('no-raw-color (Vue)', rule, {
  valid: [
    `<template><!-- was #fff --><p>Loading&#8230;</p></template>`,
    `<template><p>x</p></template>\n<style>/* #abc */ a { color: var(--talos-accent-text) }</style>`,
    `<template><p>x</p></template>\n<script>/* #000 */ export default {}</script>`,
  ],
  invalid: [
    { code: `<template><p style="color: #fff">x</p></template>`, errors: 1 },
    { code: `<template><p>x</p></template>\n<style>/* note */ a { color: #abc }</style>`, errors: 1 },
  ],
})
