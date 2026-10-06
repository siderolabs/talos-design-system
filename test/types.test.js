// Copyright (c) 2026 Sidero Labs, Inc.

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { designSystem } from '../lint/eslint/index.js'

let tsc
try {
  tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')
} catch {
  tsc = undefined
}

describe('type declarations', () => {
  it('compile against a consumer that imports every entry point', { skip: !tsc && 'TypeScript is not installed' }, () => {
    const project = fileURLToPath(new URL('./fixtures/types/tsconfig.json', import.meta.url))

    try {
      execFileSync(process.execPath, [tsc, '-p', project, '--pretty', 'false'], { encoding: 'utf8' })
    } catch (error) {
      assert.fail(error.stdout || error.message)
    }
  })

  it('name every eslint rule the plugin ships', () => {
    const declaration = readFileSync(new URL('../lint/eslint/index.d.ts', import.meta.url), 'utf8')
    const declared = declaration.match(/type DesignSystemRule = (.+)/)[1].match(/'[^']+'/g).map((name) => name.slice(1, -1))

    assert.deepEqual(declared.sort(), Object.keys(designSystem.rules).sort())
  })
})
