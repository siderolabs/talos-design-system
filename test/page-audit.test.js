// Copyright (c) 2026 Sidero Labs, Inc.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, describe, it } from 'node:test'
import { pathToFileURL } from 'node:url'

import { auditPage, configFromTokens } from '../audit/page-audit.js'

const tokens = JSON.parse(readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'))
const fixture = pathToFileURL(new URL('./fixtures/audit.html', import.meta.url).pathname).href

let playwright
try {
  playwright = await import('playwright')
} catch {
  playwright = undefined
}

describe('page audit', { skip: !playwright && 'Playwright is not installed' }, () => {
  let browser
  let report

  before(async () => {
    browser = await playwright.chromium.launch()
    const page = await browser.newPage()
    await page.goto(fixture)
    report = await page.evaluate(auditPage, configFromTokens(tokens))
  })

  after(() => browser?.close())

  const find = (check, value) => report.findings.find((f) => f.check === check && f.value === value)

  it('reads the scale and menu from the built tokens', () => {
    const config = configFromTokens(tokens)
    assert.deepEqual(config.typeScale.map(({ px }) => px), [10, 11, 12, 14, 16, 20, 24, 30])
    assert.deepEqual(config.spacing.map(({ px }) => px), [4, 8, 12, 16, 24, 32, 64])
    assert.equal(config.stacks.sans[0], 'Manrope')
  })

  it('flags text below the floor, including 10px that is not a tracked label', () => {
    assert.equal(find('type-floor', '9px')?.count, 1)
    assert.equal(find('type-floor', '10px')?.count, 1)
  })

  it('flags sizes off the scale', () => {
    assert.equal(find('type-scale', '13px')?.count, 1)
  })

  it('flags off-menu spacing and ignores auto, percentages and hairlines', () => {
    assert.equal(find('spacing', '18px')?.count, 4)
    assert.equal(find('spacing', '2px')?.count, 2)
    const values = report.findings.filter((f) => f.check === 'spacing').map((f) => f.value)
    assert.deepEqual(values.sort(), ['18px', '2px'])
  })

  it('flags typefaces outside the stacks and fonts from another origin', () => {
    assert.ok(find('font-family', 'Arial'))
    assert.ok(find('font-external', 'fonts.example.invalid'))
  })

  it('flags colours that match no role in the active theme', () => {
    const colours = report.findings.filter((f) => f.check === 'color')
    assert.deepEqual(colours.map((f) => f.value), ['#123456'])
  })
})
