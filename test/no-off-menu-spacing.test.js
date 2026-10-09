// Copyright (c) 2026 Sidero Labs, Inc.

import { describe, it } from 'node:test'
import { RuleTester } from 'eslint'
import vueParser from 'vue-eslint-parser'

import rule from '../lint/eslint/no-off-menu-spacing.js'

RuleTester.describe = describe
RuleTester.it = it

const jsx = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
})

const vue = new RuleTester({ languageOptions: { parser: vueParser } })

const error = (className) => ({ message: new RegExp(`instead of "${className.replace(/[[\]().!]/g, '\\$&')}"`) })

jsx.run('no-off-menu-spacing (JS and JSX)', rule, {
  valid: [
    `const a = <div className="p-compact gap-tight -mt-micro md:px-base" />`,
    `const a = <div className="p-0 m-auto px-px space-x-reverse" />`,
    // Words that start like a spacing utility but are not one.
    `const cluster = 'my-cluster'`,
    `const ids = ['p-section-title', 'me-and-you', 'gap-analysis']`,
    // Markup inside a string: the closing quote is not part of the class.
    `const story = '<div class="flex gap-tight"><story/></div>'`,
    "const story = `<div class='p-compact'>${slot}</div>`",
    // Tailwind v4 trailing important.
    `const a = <div className="p-0! md:gap-tight!" />`,
  ],
  invalid: [
    { code: `const a = <div className="p-4" />`, errors: [error('p-4')] },
    { code: `const a = <div className="-mt-2.5" />`, errors: [error('-mt-2.5')] },
    { code: `const a = cn('gap-x-[13px]', 'p-(--gutter)')`, errors: [error('gap-x-[13px]'), error('p-(--gutter)')] },
    { code: `const story = '<div class="flex gap-4"><story/></div>'`, errors: [error('gap-4')] },
    { code: "const story = `<div class='flex p-4'>${slot}</div>`", errors: [error('p-4')] },
    { code: `const a = <div className="p-4! !m-2" />`, errors: [error('p-4!'), error('!m-2')] },
  ],
})

vue.run('no-off-menu-spacing (Vue)', rule, {
  valid: [
    `<template><div class="p-compact" :data-name="'my-cluster'">x</div></template>`,
    `<template><TButton class="p-0!">x</TButton></template>`,
  ],
  invalid: [
    { code: `<template><div class="gap-3">x</div></template>`, errors: [error('gap-3')] },
    { code: `<template><div :class="{ 'p-4!': dense }">x</div></template>`, errors: [error('p-4!')] },
  ],
})
