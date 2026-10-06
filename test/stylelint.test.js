// Copyright (c) 2026 Sidero Labs, Inc.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import talos from '../lint/stylelint.js'

let stylelint
try {
  stylelint = (await import('stylelint')).default
} catch {
  stylelint = undefined
}

/** Lints `code` as if it were a file of that name in a host repo extending the config. */
async function lint(codeFilename, code) {
  const { results } = await stylelint.lint({ code, codeFilename, config: { extends: [talos] } })
  const [result] = results

  return {
    parseErrors: result.parseErrors.map(({ text }) => text),
    warnings: result.warnings.map(({ rule, line }) => ({ rule, line })),
  }
}

describe('stylelint config', { skip: !stylelint && 'stylelint is not installed' }, () => {
  it('flags raw values in plain CSS', async () => {
    const { warnings } = await lint('src/index.css', [
      '.card { color: #fff; padding: 13px; }',
      '.ok { color: var(--talos-text); padding: var(--talos-space-base); }',
    ].join('\n'))

    assert.deepEqual(warnings.map(({ line }) => line), [1, 1, 1])
  })

  it('reads SCSS syntax without parse errors', async () => {
    const { parseErrors, warnings } = await lint('src/card.scss', [
      '// a line comment, which plain CSS cannot parse',
      '$accent: var(--talos-accent);',
      '.card {',
      '  color: $accent;',
      '  &__title { font-size: 13px; }',
      '}',
    ].join('\n'))

    assert.deepEqual(parseErrors, [])
    assert.deepEqual(warnings, [{ rule: 'declaration-property-unit-allowed-list', line: 5 }])
  })

  it('reads the style blocks of a Vue component and nothing else', async () => {
    const { parseErrors, warnings } = await lint('src/Card.vue', [
      '<template>',
      '  <div class="card">#fff in a template is the eslint rule\'s job</div>',
      '</template>',
      '',
      '<style scoped>',
      '.card { margin: 10px; }',
      '</style>',
    ].join('\n'))

    assert.deepEqual(parseErrors, [])
    assert.deepEqual(warnings, [{ rule: 'declaration-property-value-disallowed-list', line: 6 }])
  })

  it('reads SCSS inside a Vue style block', async () => {
    const { parseErrors, warnings } = await lint('src/Card.vue', [
      '<template><div class="card" /></template>',
      '',
      '<style lang="scss">',
      '// a line comment',
      '.card {',
      '  &__title { color: #333; }',
      '}',
      '</style>',
    ].join('\n'))

    assert.deepEqual(parseErrors, [])
    assert.deepEqual(warnings.map(({ line }) => line), [6, 6])
  })
})
