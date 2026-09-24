#!/usr/bin/env node
// Copyright (c) 2026 Sidero Labs, Inc.
//
// Opens one or more pages in a headless browser, runs audit/page-audit.js in
// each, and prints what is off the system. Exits 1 when a page has more
// violations than --max, so it can gate CI or an agent's migration loop.

import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { auditPage, configFromTokens } from '../audit/page-audit.js'

const USAGE = `Usage: talos-audit [options] <url...>

Options:
  --json                 Print the findings as JSON
  --max <n>              Exit 1 when any page has more than n violations
  --checks <list>        Comma-separated: type,spacing,fonts,color (default: all)
  --storage-state <file> Playwright storage state, for pages behind a login
  --proxy <url>          Proxy server, e.g. socks5://127.0.0.1:8888
  --theme <name>         Set data-theme and data-bs-theme on <html> before auditing
  --width <px>           Viewport width (default 1440)
  --wait <ms>            Extra wait after load, for pages that render late (default 500)
  --samples <n>          Example elements per finding (default 3)
  --help                 Show this message`

const LABELS = {
  'type-floor': 'Text below the floor',
  'type-scale': 'Font sizes off the scale',
  'font-family': 'Typefaces outside the Manrope and JetBrains Mono stacks',
  'font-unserved': 'Our typefaces requested but not served by the page',
  'font-external': 'Fonts loaded from another origin',
  spacing: 'Spacing off the menu',
  color: 'Colours that match no role in the active theme',
}

function fail(message) {
  console.error(message)
  process.exit(2)
}

let args
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: 'boolean' },
      max: { type: 'string' },
      checks: { type: 'string' },
      'storage-state': { type: 'string' },
      proxy: { type: 'string' },
      theme: { type: 'string' },
      width: { type: 'string', default: '1440' },
      wait: { type: 'string', default: '500' },
      samples: { type: 'string', default: '3' },
      help: { type: 'boolean' },
    },
  })
} catch (error) {
  fail(`${error.message}\n\n${USAGE}`)
}

const { values: options, positionals: urls } = args
if (options.help) {
  console.log(USAGE)
  process.exit(0)
}
if (!urls.length) fail(USAGE)

const max = options.max === undefined ? undefined : Number(options.max)
if (max !== undefined && !Number.isInteger(max)) fail(`--max takes a whole number, got "${options.max}".`)

let playwright
try {
  playwright = await import('playwright')
} catch {
  fail(
    'talos-audit drives a browser through Playwright, which is an optional dependency. Install it where you run the audit:\n\n' +
      '  npm install --save-dev playwright\n  npx playwright install chromium',
  )
}

const tokens = JSON.parse(readFileSync(new URL('../dist/tokens.json', import.meta.url), 'utf8'))
const config = {
  ...configFromTokens(tokens, { samples: Number(options.samples) }),
  checks: options.checks?.split(',').map((check) => check.trim()),
}

let browser
try {
  browser = await playwright.chromium.launch({ proxy: options.proxy ? { server: options.proxy } : undefined })
} catch (error) {
  fail(`Could not start Chromium. If the browser is missing, run \`npx playwright install chromium\`.\n\n${error.message}`)
}

const context = await browser.newContext({
  viewport: { width: Number(options.width), height: 900 },
  storageState: options['storage-state'],
})

const reports = []
for (const url of urls) {
  const page = await context.newPage()
  const requests = []
  page.on('request', (request) => requests.push(request.url()))
  try {
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    if (options.theme) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme
        document.documentElement.dataset.bsTheme = theme
      }, options.theme)
    }
    await page.waitForTimeout(Number(options.wait))
    await page.evaluate(() => document.fonts.ready)
    reports.push(await page.evaluate(auditPage, { ...config, requests }))
  } catch (error) {
    reports.push({ url, error: error.message.split('\n')[0] })
  } finally {
    await page.close()
  }
}

await browser.close()

const over = (report) => report.error || (max !== undefined && report.total > max)

if (options.json) {
  console.log(JSON.stringify(reports, null, 2))
} else {
  for (const report of reports) console.log(format(report))
}

process.exit(reports.some(over) ? 1 : 0)

function format(report) {
  if (report.error) return `${report.url}\n  Could not audit: ${report.error}\n`

  const lines = [
    report.url,
    `  ${report.elements.toLocaleString('en')} visible elements, ${report.total.toLocaleString('en')} violations${max !== undefined ? ` (max ${max})` : ''}.`,
    ...report.notes.map((note) => `  ${note}`),
  ]

  for (const check of Object.keys(LABELS)) {
    const findings = report.findings.filter((finding) => finding.check === check)
    if (!findings.length) continue

    lines.push('', `  ${LABELS[check]} (${report.byCheck[check].toLocaleString('en')})`)
    for (const finding of findings) {
      const extra = [
        finding.renders && `renders as ${finding.renders}`,
        finding.note,
        Object.keys(finding.properties).length &&
          Object.entries(finding.properties)
            .sort((a, b) => b[1] - a[1])
            .map(([property, count]) => `${property} ${count}`)
            .join(', '),
      ].filter(Boolean)

      lines.push(`    ${finding.value.padEnd(14)} \u00d7${String(finding.count).padEnd(5)} ${extra.join('; ')}`.trimEnd())
      for (const { selector, text } of finding.samples) lines.push(`      ${selector}${text ? `  "${text}"` : ''}`)
    }
  }

  return lines.join('\n') + '\n'
}
