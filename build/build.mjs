// Copyright (c) 2026 Sidero Labs, Inc.
//
// Compiles the token source in tokens/ into the artifacts in dist/.
//
// The build is deliberately dependency-free: the source files are valid DTCG
// (W3C Design Tokens) JSON, so Style Dictionary can be dropped in later
// without touching them, but nothing about publishing a token package should
// require a toolchain to be healthy first. Hand-written formatters also let
// the output carry the comments that make dist/ readable, which is the file
// most people will actually open.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PREFIX = '--talos-'

const read = (name) => JSON.parse(readFileSync(join(ROOT, 'tokens', name), 'utf8'))

/**
 * Walks a DTCG tree and returns tokens keyed by dash-joined path. A node is a
 * token when it carries `$value`; `$type` and `$description` inherit from the
 * groups above it.
 */
function flatten(tree, path = [], inherited = {}, out = new Map()) {
  const type = tree.$type ?? inherited.type

  if (tree.$value !== undefined) {
    out.set(path.join('-'), {
      value: tree.$value,
      type,
      description: tree.$description,
      extensions: tree.$extensions,
      path,
    })
    return out
  }

  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith('$')) continue
    flatten(child, [...path, key], { type }, out)
  }

  return out
}

const REFERENCE = /\{([^}]+)\}/g

/** Resolves `{a.b.c}` references to literal values, following chains. */
function resolve(value, lookup, seen = new Set()) {
  if (typeof value !== 'string') return value

  return value.replace(REFERENCE, (_, ref) => {
    const name = ref.split('.').join('-')
    if (seen.has(name)) throw new Error(`Circular token reference at {${ref}}`)

    const target = lookup.get(name)
    if (!target) throw new Error(`Unknown token reference {${ref}}`)

    return resolve(target.value, lookup, new Set([...seen, name]))
  })
}

/** Rewrites `{a.b.c}` to `var(--talos-a-b-c)` so the indirection survives into CSS. */
const toVarReference = (value) =>
  typeof value === 'string'
    ? value.replace(REFERENCE, (_, ref) => `var(${PREFIX}${ref.split('.').join('-')})`)
    : value

const primitives = flatten(read('primitive.json'))
const dark = flatten(read('semantic.dark.json'))
const light = flatten(read('semantic.light.json'))

// Semantic themes resolve against the primitives and against themselves.
const darkLookup = new Map([...primitives, ...dark])
const lightLookup = new Map([...primitives, ...light])

// A role present in one theme and missing from the other is the single most
// common way a token system rots, so it is a build failure rather than a lint.
const missing = [
  ...[...dark.keys()].filter((k) => !light.has(k)).map((k) => `${k} is in dark but not light`),
  ...[...light.keys()].filter((k) => !dark.has(k)).map((k) => `${k} is in light but not dark`),
]
if (missing.length) {
  console.error('Theme role sets diverge:\n  ' + missing.join('\n  '))
  process.exit(1)
}

// ------------------------------------------------------------ type roles

const roles = flatten(read('type-roles.json'))

const ROLE_FIELDS = {
  fontFamily: ['family', 'font-family'],
  fontSize: ['size', 'font-size'],
  fontWeight: ['weight', 'font-weight'],
  lineHeight: ['leading', 'line-height'],
  letterSpacing: ['tracking', 'letter-spacing'],
}

// A role is a name for a combination of existing steps. A role that brings its
// own size is how an off-scale 13px gets back in with a respectable name, so
// every field has to be a reference into the matching primitive group.
const ROLE_GROUP = { fontFamily: 'font', fontSize: 'text', fontWeight: 'weight', lineHeight: 'leading', letterSpacing: 'tracking' }
for (const [name, token] of roles) {
  for (const [field, group] of Object.entries(ROLE_GROUP)) {
    const value = token.value[field]
    if (typeof value !== 'string' || !value.startsWith(`{${group}.`)) {
      console.error(`${name}.${field} must reference a ${group}.* token, got ${JSON.stringify(value)}`)
      process.exit(1)
    }
    resolve(value, primitives)
  }
}

const roleExtras = (token) => token.extensions?.['com.siderolabs.talos'] ?? {}

/** The role's custom properties, as [name, value] pairs referencing the scale. */
const roleVars = (name, token) =>
  Object.entries(ROLE_FIELDS).map(([field, [suffix]]) => [`${PREFIX}${name}-${suffix}`, toVarReference(token.value[field])])

/** The declarations that apply a role, reading its custom properties. */
function roleDeclarations(name, token) {
  const declarations = Object.entries(ROLE_FIELDS).map(([, [suffix, property]]) => [property, `var(${PREFIX}${name}-${suffix})`])
  const extras = roleExtras(token)
  if (extras.transform) declarations.push(['text-transform', extras.transform])
  if (extras.numeric) declarations.push(['font-variant-numeric', extras.numeric])
  return declarations
}

const comment = (token) => (token.description ? `  /* ${token.description} */` : '')

/** Groups tokens by their first path segment so output stays readable. */
function byGroup(tokens) {
  const groups = new Map()
  for (const [name, token] of tokens) {
    const group = token.path[0]
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push([name, token])
  }
  return groups
}

const NOTICE = [
  'Talos Design System tokens. GENERATED FILE, DO NOT EDIT.',
  '',
  'Source: tokens/ in @siderolabs/talos-design-system. Change a value there, run',
  '`npm run build`, and every product picks it up on its next version bump.',
]

const HEADER = ['/*', ...NOTICE.map((line) => ` * ${line}`.trimEnd()), ' */'].join('\n')
const SCSS_HEADER = NOTICE.map((line) => `// ${line}`.trimEnd()).join('\n')

// ---------------------------------------------------------------- tokens.css

function buildCss() {
  const lines = [HEADER, '']

  lines.push(':root {')
  for (const [group, tokens] of byGroup(primitives)) {
    lines.push(`  /* ${group} */`)
    for (const [name, token] of tokens) {
      lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};${comment(token)}`)
    }
    lines.push('')
  }
  lines.push('  /* Type roles. Theme-independent. Apply with type.css, the Tailwind')
  lines.push('     type-* utilities or the SCSS talos-type mixin. */')
  for (const [name, token] of roles) {
    lines.push(`  /* ${name}: ${token.description} */`)
    for (const [property, value] of roleVars(name, token)) lines.push(`  ${property}: ${value};`)
  }
  lines.push('')
  lines.push('  /* Semantic roles. Dark is the default theme. */')
  for (const [name, token] of dark) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  lines.push('}', '')

  lines.push('/*')
  lines.push(' * Light theme. Products map their own theme switch onto one of these')
  lines.push(' * selectors, or re-declare the block under whatever attribute they already')
  lines.push(' * use (Bootstrap hosts: html[data-bs-theme="light"], via the SCSS mixin).')
  lines.push(' */')
  lines.push('[data-theme="light"],')
  lines.push('.talos-theme-light {')
  for (const [name, token] of light) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  lines.push('}', '')

  return lines.join('\n')
}

// --------------------------------------------------------------- tokens.scss

function buildScss() {
  const lines = [
    SCSS_HEADER,
    '',
    "@use 'sass:list';",
    '',
    '// Sass variables carry resolved literals because Bootstrap needs',
    '// compile-time values ($primary, $body-bg). The mixins below emit the same',
    '// values as custom properties so themes can still switch at runtime.',
    '',
  ]

  for (const [group, tokens] of byGroup(primitives)) {
    lines.push(`// ${group}`)
    for (const [name, token] of tokens) {
      lines.push(`$talos-${name}: ${resolve(token.value, primitives)};`)
    }
    lines.push('')
  }

  for (const [theme, tokens, lookup] of [
    ['dark', dark, darkLookup],
    ['light', light, lightLookup],
  ]) {
    lines.push(`// Semantic roles, ${theme} theme`)
    for (const [name, token] of tokens) {
      lines.push(`$talos-${theme}-${name}: ${resolve(token.value, lookup)};`)
    }
    lines.push('')
  }

  for (const [theme, tokens] of [
    ['dark', dark],
    ['light', light],
  ]) {
    lines.push(`// Emits the ${theme} semantic roles as custom properties. Include inside`)
    lines.push(`// whatever selector the host app uses for its ${theme} theme.`)
    lines.push(`@mixin talos-tokens-${theme} {`)
    for (const [name, token] of tokens) {
      lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
    }
    lines.push('}', '')
  }

  lines.push('// Primitives never change with the theme, so they can be emitted once.')
  lines.push('@mixin talos-primitives {')
  for (const [name, token] of primitives) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  for (const [name, token] of roles) {
    for (const [property, value] of roleVars(name, token)) lines.push(`  ${property}: ${value};`)
  }
  lines.push('}', '')

  lines.push('// Applies a type role: @include talos.talos-type(meta). Reads the role\'s')
  lines.push('// custom properties, so talos-primitives must be emitted somewhere above.')
  lines.push('@mixin talos-type($role) {')
  const names = [...roles.keys()].map((name) => name.replace(/^type-/, ''))
  lines.push(`  @if not list.index((${names.map((n) => `'${n}'`).join(', ')}), '#{$role}') {`)
  lines.push('    @error "Unknown type role \'#{$role}\'. See docs/type-roles.md.";')
  lines.push('  }')
  for (const [property, suffix] of Object.values(ROLE_FIELDS).map(([s, p]) => [p, s])) {
    lines.push(`  ${property}: var(${PREFIX}type-#{$role}-${suffix});`)
  }
  for (const [name, token] of roles) {
    const extras = roleDeclarations(name, token).slice(Object.keys(ROLE_FIELDS).length)
    if (!extras.length) continue
    lines.push(`  @if '#{$role}' == '${name.replace(/^type-/, '')}' {`)
    for (const [property, value] of extras) lines.push(`    ${property}: ${value};`)
    lines.push('  }')
  }
  lines.push('}', '')

  return lines.join('\n')
}

// ----------------------------------------------------------------- type.css

function buildTypeCss() {
  const lines = [
    HEADER,
    '',
    '/*',
    ' * Type role classes, for consumers without Tailwind or Sass. Import',
    ' * tokens.css first; these read its custom properties.',
    ' *',
    ' * Choose the role from what the text is, not from the size you want.',
    ' * docs/type-roles.md is the decision guide.',
    ' */',
    '',
  ]
  for (const [name, token] of roles) {
    lines.push(`/* ${token.description} */`)
    lines.push(`.talos-${name} {`)
    for (const [property, value] of roleDeclarations(name, token)) lines.push(`  ${property}: ${value};`)
    lines.push('}', '')
  }
  return lines.join('\n')
}

// ------------------------------------------------------------- tailwind.css

/** Maps a token path onto the Tailwind v4 theme namespace that generates utilities for it. */
function tailwindNamespace(token) {
  const [group] = token.path
  if (group === 'space') return '--spacing'
  if (group === 'radius') return '--radius'
  if (group === 'font') return '--font'
  if (group === 'text') return '--text'
  if (group === 'weight') return '--font-weight'
  if (group === 'leading') return '--leading'
  if (group === 'tracking') return '--tracking'
  if (group === 'shadow') return '--shadow'
  if (token.type === 'color') return '--color'
  return undefined
}

function buildTailwind() {
  const lines = [
    HEADER,
    '',
    '/*',
    ' * Tailwind v4 theme for consumers on Tailwind (Omni today).',
    ' *',
    ' * Import tokens.css before this file. It deliberately does not import it',
    ' * itself: nothing in dist/ should assume a package path, so that every',
    ' * file here can also be vendored into a product that cannot take a',
    ' * dependency on this repository. Omni is that product.',
    ' *',
    ' * `@theme inline` is deliberate: it makes the generated utilities',
    ' * reference the custom property rather than copy its value, which is what',
    ' * lets the theme switch at runtime.',
    ' */',
    '',
    '@theme inline {',
  ]

  const emit = (label, tokens) => {
    lines.push(`  /* ${label} */`)
    for (const [name, token] of tokens) {
      const namespace = tailwindNamespace(token)
      if (!namespace) continue
      const suffix = token.path[0] === 'space' || namespace !== '--color' ? token.path.slice(1).join('-') : name
      lines.push(`  ${namespace}-${suffix || token.path[0]}: var(${PREFIX}${name});`)
    }
    lines.push('')
  }

  emit('Scales. Theme-independent.', [...primitives].filter(([, t]) => t.type !== 'color'))
  emit('Semantic colour roles. These are what application code uses.', [...dark].filter(([, t]) => t.type === 'color'))
  emit('Elevation.', [...dark].filter(([, t]) => t.type === 'shadow'))

  lines.push('}', '')
  lines.push('/*')
  lines.push(' * Aliases for role names Omni already ships, so adopting the shared set is')
  lines.push(' * a re-point rather than a rename across every component.')
  lines.push(' */')
  lines.push('@theme inline {')
  lines.push(`  --color-content-strong: var(${PREFIX}content-emphasis);`)
  lines.push(`  --color-surface-inverse: var(${PREFIX}surface-inverse);`)
  lines.push('}', '')

  lines.push('/*')
  lines.push(' * Type roles as utilities: class="type-meta". Prefer these to text-* sizes')
  lines.push(' * in application code. docs/type-roles.md is the decision guide.')
  lines.push(' */')
  for (const [name, token] of roles) {
    lines.push(`@utility ${name} {`)
    for (const [property, value] of roleDeclarations(name, token)) lines.push(`  ${property}: ${value};`)
    lines.push('}')
  }
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------- fonts.css

const faces = JSON.parse(readFileSync(join(ROOT, 'fonts', 'faces.json'), 'utf8')).faces

// A @font-face rule pointing at a file that is not in the tree fails silently
// in a browser, which is the same failure this whole arrangement exists to
// avoid, so it fails loudly here instead.
for (const face of faces) {
  if (!existsSync(join(ROOT, 'fonts', face.file))) {
    console.error(`fonts/faces.json names ${face.file}, which is not in fonts/. Run \`npm run fonts\`.`)
    process.exit(1)
  }
}

/**
 * Emits the @font-face rules. `base` is where the consumer serves the woff2
 * files from, and it matters more than it looks: a relative path resolves
 * against the stylesheet, but Mintlify inlines its custom CSS into the
 * document, where a relative path would resolve against the page URL and break
 * on every nested route. Hence a root-absolute path for that build.
 */
function fontFaces(base) {
  const lines = []

  for (const face of faces) {
    lines.push(
      '@font-face {',
      `  font-family: '${face.family}';`,
      '  font-style: normal;',
      `  font-weight: ${face.weight};`,
      '  font-display: swap;',
      `  src: url('${base}/${face.file}') format('woff2');`,
      `  unicode-range: ${face.unicodeRange};`,
      '}',
      '',
    )
  }

  return lines
}

const FONT_NOTE = [
  '/* Self-hosted so the type survives an air-gapped install. A product that',
  '   loads these from Google falls back to a system font behind a customer',
  '   firewall and stops looking like itself, silently. Variable weight 400 to',
  '   700; the unicode ranges keep a browser from fetching a subset it will not',
  '   use. Both families are OFL 1.1, licences in fonts/. */',
]

function buildFontsCss() {
  return [
    HEADER,
    '',
    '/*',
    ' * Typefaces, for consumers that serve the woff2 files next to this',
    ' * stylesheet. Copy the fonts/ directory alongside it and the relative',
    ' * paths resolve; serve them from somewhere else and re-point the url()s.',
    ' */',
    '',
    ...FONT_NOTE,
    '',
    ...fontFaces('./fonts'),
  ].join('\n')
}

// ------------------------------------------------------------- mintlify.css

/** `#E04B45` to `224 75 69`. Mintlify's colour variables hold bare triplets so it can wrap them in rgb(). */
function triplet(value, lookup) {
  const hex = resolve(value, lookup).trim()
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Mintlify needs an opaque hex, got "${hex}"`)
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(' ')
}

// Mintlify's neutral ramp is derived from the primary colour, which is how the
// docs site ended up with a pink-tinted grey. Pointing the ramp at our own
// primitives is what actually moves the chrome warm; the accent alone doesn't.
// Steps are matched to the lightness of the ramp they replace.
const MINTLIFY_GRAY = {
  50: '{cream.1}',
  100: '{cream.3}',
  200: '{cream.4}',
  300: '{cream.5}',
  400: '{cream.6}',
  500: '{cream.7}',
  600: '{cream.8}',
  700: '{cream.9}',
  800: '{ink.5}',
  900: '{ink.2}',
  950: '{ink.1}',
}

// Mintlify's callout types, mapped onto status states. Note has no status
// counterpart: it is neutral like info and differs from it by icon only.
const CALLOUTS = {
  danger: 'danger',
  warning: 'warning',
  tip: 'success',
  check: 'success',
  info: 'info',
  note: 'info',
}

// The footer's "Powered by" line and the Mintlify wordmark beside it (drawn in
// currentColor). Hover is left to Mintlify, which darkens it further.
const MINTLIFY_FOOTER = ['#footer a[href*="mintlify.com"]:not(:hover)']

// States whose large surfaces carry a colour edge on dark. Info is neutral.
const EDGED = new Set(['success', 'warning', 'danger'])

/**
 * Colour treatments for Mintlify's own components. Everything here is a
 * colour, a colour bar, or the text colour on a coloured surface; layout
 * stays in the docs repo. Rules are written once against the roles and pick
 * up the theme from the `.dark` block above. `html:root` and `html.dark`
 * match the specificity Mintlify's own dark-variant utilities need to lose to.
 */
function mintlifyComponents() {
  const v = (name) => `var(${PREFIX}${name})`
  const lines = [
    '/* ------------------------------------------------ Mintlify component colours */',
    '',
    '/* Announcement banner. White text sits on the solid accent band in the middle',
    '   of the gradient. The link underline is the dark-theme accent text in both',
    '   themes, because the banner is the same colour in both. */',
    `html #banner { background: ${v('accent-gradient-fill')}; }`,
    `html #banner, html #banner * { color: ${v('content-on-accent')} !important; }`,
    `html #banner a { text-decoration-color: ${v('red-1')} !important; }`,
    '',
    '/* Topbar call to action: the primary button. */',
    `html #topbar-cta-button a > span:first-child { background: ${v('accent-fill')}; }`,
    'html #topbar-cta-button a:hover > span:first-child { opacity: 0.9; }',
    `html #topbar-cta-button a, html #topbar-cta-button a * { color: ${v('content-on-accent')} !important; }`,
    '',
    '/* Active sidebar item, marker style: emphasis text, an accent-tinted pill,',
    '   and a bar in accent text inset from the left. Mintlify marks the item',
    '   with a different utility class per theme. */',
  ]

  for (const item of [
    'html:not(.dark) a[aria-current="page"].bg-primary\\/10',
    'html.dark a[aria-current="page"].dark\\:bg-primary-light\\/10',
  ]) {
    lines.push(
      `${item} { background-color: ${v('accent-subtle')} !important; color: ${v('content-emphasis')} !important; position: relative; }`,
      `${item}::before { content: ""; position: absolute; left: 6px; top: 25%; bottom: 25%; width: ${v('border-edge')}; border-radius: 2px; background: ${v('accent-text')}; }`,
    )
  }

  lines.push(
    '',
    '/* Callouts. Body text stays content-default; only the icon and bold title',
    '   take the status colour. Light surfaces are a pastel of the fill; dark',
    '   surfaces are neutral with a colour edge on the left. */',
  )
  for (const [type, state] of Object.entries(CALLOUTS)) {
    const sel = `[data-callout-type="${type}"]`
    const icon = type === 'note' ? 'content-secondary' : `status-${state}-text`
    const title = state === 'info' ? 'content-emphasis' : `status-${state}-text`
    lines.push(
      `html:root ${sel} { background-color: ${v(`status-${state}-surface`)}; border-color: ${v(`status-${state}-border`)}; }`,
      `html:root ${sel} svg { color: ${v(icon)} !important; }`,
      `html:root ${sel} [class*="prose"] { color: ${v('content-default')} !important; }`,
      `html:root ${sel} [class*="prose"] strong { color: ${v(title)} !important; }`,
    )
    if (EDGED.has(state)) {
      lines.push(`html.dark ${sel} { border-left: ${v('border-edge')} solid ${v(`status-${state}-fill`)}; }`)
    }
  }

  lines.push(
    '',
    '/* Footer. The "Powered by" line is read, so it takes content-muted rather',
    '   than the disabled grey Mintlify gives it (3.05:1 light, 3.27:1 dark). */',
    ...MINTLIFY_FOOTER.map((sel) => `html ${sel} { color: ${v('content-muted')} !important; }`),
    '',
  )

  return lines
}

function buildMintlify() {
  const rgb = (ref) => triplet(ref, primitives)
  const lightRgb = (ref) => triplet(ref, lightLookup)
  const darkRgb = (ref) => triplet(ref, darkLookup)
  const lightHex = (ref) => resolve(ref, lightLookup)
  const darkHex = (ref) => resolve(ref, darkLookup)

  const lines = [
    '/*',
    ...NOTICE.map((line) => ` * ${line}`.trimEnd()),
    ' *',
    ' * Mintlify build, for the documentation site.',
    ' *',
    ' * Mintlify has no build step and cannot import from node_modules, so this',
    ' * is vendored rather than imported: copy it to public/talos-tokens.css in',
    ' * siderolabs/docs (alongside the hand-written style.css, which stays) and',
    ' * re-copy it on a version bump.',
    ' *',
    ' * Two things travel with it:',
    ' *',
    ' * 1. The fonts/ directory, copied to public/fonts/ in the docs repo. The',
    ' *    @font-face rules below expect them at /fonts/.',
    ' *',
    ' * 2. One block in public/docs.json, because Mintlify reads the accent from',
    ' *    configuration rather than from CSS:',
    ' *',
    ' *    The slots are not light/dark variants of one colour. Per the Mintlify',
    ' *    schema: primary is emphasis text in light mode, light is emphasis text',
    ' *    in dark mode, dark is buttons and hover states in both modes.',
    ' *',
    ' *      "colors": {',
    ` *        "primary": "${lightHex('{accent.text}')}",`,
    ` *        "light": "${darkHex('{accent.text}')}",`,
    ` *        "dark": "${lightHex('{accent.fill}')}"`,
    ' *      }',
    ' *',
    " *    Mintlify's fonts setting is deliberately left alone. It has no slot for",
    ' *    a code face, and the @font-face rules below plus the font variables at',
    ' *    the bottom of this file cover both faces without it.',
    ' */',
    '',
    ...FONT_NOTE,
    '',
    ...fontFaces('/fonts'),
    '/* ---------------------------------------------------------------- tokens */',
    '',
    '/* Light is the default here, unlike the other builds: the docs site is read',
    '   light far more often than dark, and Mintlify switches on `.dark`. */',
    ':root {',
  ]

  for (const [name, token] of primitives) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  lines.push('')
  for (const [name, token] of light) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  lines.push('}', '', '.dark {')
  for (const [name, token] of dark) {
    lines.push(`  ${PREFIX}${name}: ${toVarReference(token.value)};`)
  }
  lines.push('}', '')

  lines.push(
    '/* ------------------------------------------------ Mintlify theme variables */',
    '',
    "/* Mintlify's own variables, re-pointed at the token values. These hold bare",
    '   RGB triplets, so they are resolved literals rather than var() references',
    '   and will not follow a runtime theme switch. That is fine: Mintlify picks',
    '   the light or dark member of each pair itself. */',
    ':root {',
    `  --primary: ${lightRgb('{accent.text}')};         /* light-mode emphasis text: accent.text (light) */`,
    `  --primary-light: ${darkRgb('{accent.text}')};   /* dark-mode emphasis text: accent.text (dark) */`,
    `  --primary-dark: ${lightRgb('{accent.fill}')};    /* buttons and hover states, both modes: accent.fill */`,
    '',
    '  /* surface.chrome rather than surface.page: Mintlify draws the sidebar, the',
    '     topbar and the content on one plane, so the docs site is all chrome and',
    '     no well. Custom MDX should use surface-chrome to sit flush with it. */',
    `  --background-light: ${rgb('{cream.1}')};`,
    `  --background-dark: ${rgb('{ink.1}')};`,
    '',
  )
  for (const [step, ref] of Object.entries(MINTLIFY_GRAY)) {
    lines.push(`  --gray-${step}: ${rgb(ref)};`)
  }
  lines.push(
    '',
    '  /* Mintlify names its faces after the fonts it ships with. Overriding the',
    '     variables re-types the site without touching component markup. */',
    `  --font-inter: var(${PREFIX}font-sans);`,
    `  --font-paper-mono: var(${PREFIX}font-mono);`,
    '}',
    '',
    ...mintlifyComponents(),
  )

  // Site-specific layout rules (tables, nav logo sizing, content width) stay
  // hand-written in the docs repo's style.css. Only tokens, theme variables,
  // @font-face rules, and colour treatments of Mintlify's own components
  // belong here: a docs layout tweak must not require a design-system release.

  return lines.join('\n')
}

// -------------------------------------------------------------- tokens.json

function buildJson() {
  const entry = ([name, token], lookup) => [
    name,
    {
      value: resolve(token.value, lookup),
      reference: typeof token.value === 'string' && token.value.includes('{') ? token.value : undefined,
      type: token.type,
      description: token.description,
    },
  ]

  return JSON.stringify(
    {
      $comment: 'GENERATED. Resolved token values for Figma sync, documentation and tooling.',
      prefix: PREFIX,
      primitive: Object.fromEntries([...primitives].map((t) => entry(t, primitives))),
      semantic: {
        dark: Object.fromEntries([...dark].map((t) => entry(t, darkLookup))),
        light: Object.fromEntries([...light].map((t) => entry(t, lightLookup))),
      },
      typeRoles: Object.fromEntries(
        [...roles].map(([name, token]) => [
          name.replace(/^type-/, ''),
          {
            ...Object.fromEntries(Object.entries(token.value).map(([field, ref]) => [field, resolve(ref, primitives)])),
            reference: token.value,
            ...roleExtras(token),
            description: token.description,
          },
        ]),
      ),
    },
    null,
    2,
  )
}

// ------------------------------------------------------------------- write

mkdirSync(join(ROOT, 'dist'), { recursive: true })

const artifacts = {
  'tokens.css': buildCss(),
  'tokens.scss': buildScss(),
  'tailwind.css': buildTailwind(),
  'fonts.css': buildFontsCss(),
  'type.css': buildTypeCss(),
  'mintlify.css': buildMintlify(),
  'tokens.json': buildJson() + '\n',
}

for (const [name, contents] of Object.entries(artifacts)) {
  writeFileSync(join(ROOT, 'dist', name), contents)
  console.log(`dist/${name}`)
}

console.log(
  `\n${primitives.size} primitives, ${dark.size} semantic roles \u00d7 2 themes, ` +
    `${primitives.size + dark.size} custom properties per theme.`,
)
