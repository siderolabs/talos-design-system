#!/usr/bin/env node
// Copyright (c) 2026 Sidero Labs, Inc.

// Rewrites Tailwind's numeric spacing utilities onto the named steps, for a
// product moving from p-4 to p-compact. Only values that land exactly on a
// step are rewritten, so the rendered page does not change. Everything else
// is listed at the end: those are design decisions, not renames.
//
//   npx talos-migrate-spacing <dir> [--dry-run]

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const STEPS = { 1: 'micro', 2: 'tight', 3: 'snug', 4: 'compact', 6: 'base', 8: 'section', 16: 'major' }

// The utilities no-off-menu-spacing covers, longest prefix first.
const UTILITIES = 'gap-x|gap-y|gap|space-x|space-y|px|py|pt|pb|pl|pr|ps|pe|p|mx|my|mt|mb|ml|mr|ms|me|m'

// A class token: optional variants (hover:, md:, group-hover/item:), optional
// important and negative marks, the utility, a numeric value. The lookbehind
// and lookahead keep it from matching inside identifiers or longer classes.
const CLASS = new RegExp(
  `(?<=^|[\\s"'\`(\\[,{:!])(-?)(${UTILITIES})-(\\d+(?:\\.\\d+)?|\\[[^\\]\\s]+\\])(?=$|[\\s"'\`)\\],;}!])`,
  'gm',
)

const EXTENSIONS = /\.(vue|ts|tsx|js|jsx|css|scss)$/
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (EXTENSIONS.test(name)) yield path
  }
}

const [root, ...flags] = process.argv.slice(2)
if (!root) {
  console.error('usage: migrate-spacing.mjs <dir> [--dry-run]')
  process.exit(2)
}
const dryRun = flags.includes('--dry-run')

let renamed = 0
let filesChanged = 0
const leftover = new Map()

for (const path of walk(root)) {
  const before = readFileSync(path, 'utf8')
  const after = before.replace(CLASS, (match, negative, utility, value) => {
    const step = STEPS[value]
    if (step) {
      renamed++
      return `${negative}${utility}-${step}`
    }
    if (value !== '0') {
      const key = `${negative}${utility}-${value}`
      const sites = leftover.get(key) ?? []
      sites.push(relative(root, path))
      leftover.set(key, sites)
    }
    return match
  })
  if (after !== before) {
    filesChanged++
    if (!dryRun) writeFileSync(path, after)
  }
}

console.log(`${dryRun ? 'Would rename' : 'Renamed'} ${renamed} utilities in ${filesChanged} files.`)
if (leftover.size) {
  const total = [...leftover.values()].reduce((n, sites) => n + sites.length, 0)
  console.log(`\n${total} uses are off the menu and were left alone:\n`)
  for (const [key, sites] of [...leftover].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${key.padEnd(14)} ${String(sites.length).padStart(3)}  ${[...new Set(sites)].join(', ')}`)
  }
}
