// Copyright (c) 2026 Sidero Labs, Inc.
//
// Audits a rendered page against the token set: type below the floor or off
// the scale, spacing off the menu, typefaces that are not ours or not served
// by the page, fonts fetched from another origin, and colours that match no
// role in the active theme.
//
// The lint rules read source; this reads what the browser actually computed,
// which is the only way to see a Bootstrap default, a chart library's 8px
// axis label or a Google Fonts link that no source file mentions by name.
//
// Two exports. `configFromTokens` turns dist/tokens.json into the values the
// audit compares against, so nothing here restates the scale. `auditPage`
// runs in the page. It is self-contained, down to its own copy of the stack
// parser, so it can be serialised and handed to Playwright's page.evaluate,
// which is how bin/talos-audit.mjs uses it.
// In a browser console, import this file and call it directly:
//
//   const { auditPage, configFromTokens } = await import('/path/to/page-audit.js')
//   auditPage(configFromTokens(await (await fetch('/path/to/tokens.json')).json()))

/** Splits a CSS font stack into family names without quotes. */
function parseStack(stack) {
  return stack.split(',').map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
}

export function configFromTokens(tokens, { samples = 3 } = {}) {
  const scale = (prefix) =>
    Object.entries(tokens.primitive)
      .filter(([name]) => name.startsWith(prefix))
      .map(([name, token]) => ({ step: name.slice(prefix.length), px: parseFloat(token.value) }))
      .sort((a, b) => a.px - b.px)

  const typeScale = scale('text-')
  const semantic = tokens.semantic.dark

  return {
    prefix: tokens.prefix,
    typeScale,
    floor: typeScale.find(({ step }) => step === 'xs'),
    label: typeScale.find(({ step }) => step === '2xs'),
    spacing: scale('space-'),
    hairline: parseFloat(tokens.primitive['border-hairline'].value),
    stacks: {
      sans: parseStack(tokens.primitive['font-sans'].value),
      mono: parseStack(tokens.primitive['font-mono'].value),
    },
    colorRoles: Object.keys(semantic).filter((name) => semantic[name].type === 'color'),
    samples,
  }
}

/**
 * @param {ReturnType<typeof configFromTokens> & { checks?: string[], requests?: string[] }} config
 */
export function auditPage(config) {
  const checks = new Set(config.checks ?? ['type', 'spacing', 'fonts', 'color'])
  const parseStack = (stack) => stack.split(',').map((family) => family.trim().replace(/^['"]|['"]$/g, ''))
  const doc = document
  const win = window

  // Sub-pixel values come from rem and em arithmetic and from zoom; a tenth
  // of a pixel is below anything a reader can see.
  const TOLERANCE = 0.1
  const onList = (px, list) => list.some((value) => Math.abs(value - px) < TOLERANCE)
  const round = (px) => Math.round(px * 100) / 100

  const typePx = config.typeScale.map(({ px }) => px)
  const menuPx = [0, ...config.spacing.map(({ px }) => px)]
  const primaries = [config.stacks.sans[0], config.stacks.mono[0]].map((f) => f.toLowerCase())

  const groups = new Map()
  const sampled = new Map()
  const record = (check, value, el, detail = {}) => {
    const key = `${check}\u0000${value}`
    if (!groups.has(key)) {
      groups.set(key, { check, value, count: 0, samples: [], ...detail, properties: {} })
      sampled.set(key, new Set())
    }

    const group = groups.get(key)
    group.count += 1
    if (detail.property) group.properties[detail.property] = (group.properties[detail.property] ?? 0) + 1

    // One element can be off the menu on several sides; sample it once.
    const seen = sampled.get(key)
    if (el && !seen.has(el) && group.samples.length < config.samples) {
      seen.add(el)
      group.samples.push({ selector: selectorPath(el), text: sample(el) })
    }
  }

  function describe(el) {
    const tag = el.tagName.toLowerCase()
    if (el.id) return `${tag}#${el.id}`

    const classes = [...el.classList].filter((c) => c.length <= 32).slice(0, 2)

    return classes.length ? `${tag}.${classes.join('.')}` : tag
  }

  function selectorPath(el) {
    const parts = []
    for (let node = el; node && node !== doc.body && parts.length < 3; node = node.parentElement) {
      parts.unshift(describe(node))
      if (node.id) break
    }

    return parts.join(' > ')
  }

  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim()

  function sample(el) {
    const text = (ownText(el) || el.textContent || '').replace(/\s+/g, ' ').trim()

    return text.length > 40 ? `${text.slice(0, 39)}\u2026` : text
  }

  // Colours are compared as the bytes a canvas paints, which normalises every
  // syntax (hex, rgb(), oklch(), named) to one form.
  const canvas = doc.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const colourKeys = new Map()
  function colourKey(value) {
    if (!colourKeys.has(value)) {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#00000000'
      ctx.fillStyle = value
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      const hex = [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()
      colourKeys.set(value, a === 0 ? null : a === 255 ? `#${hex}` : `#${hex}${a.toString(16).padStart(2, '0').toUpperCase()}`)
    }

    return colourKeys.get(value)
  }

  const notes = []
  let palette = null
  if (checks.has('color')) {
    const style = win.getComputedStyle(doc.body)
    const values = config.colorRoles.map((role) => style.getPropertyValue(`${config.prefix}${role}`).trim()).filter(Boolean)

    if (values.length) palette = new Set(values.map(colourKey).filter(Boolean))
    else notes.push(`Colour check skipped: the page defines no ${config.prefix}* custom properties, so there is no active theme to compare against.`)
  }

  // A family is ours only when the page serves it. A copy installed on the
  // machine running the audit would otherwise hide a missing @font-face.
  const served = new Set(
    [...doc.fonts].filter((face) => face.status === 'loaded').map((face) => face.family.replace(/^['"]|['"]$/g, '').toLowerCase()),
  )

  // Width comparison against the generic families is the standard way to
  // tell whether a named system face exists, since document.fonts.check()
  // reports true for any family it has no @font-face rule for.
  const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-monospace', 'ui-serif', '-apple-system', 'blinkmacsystemfont'])
  const installed = new Map()
  function available(family) {
    const name = family.toLowerCase()
    if (GENERIC.has(name) || served.has(name)) return true
    if (!installed.has(name)) {
      const probe = 'mmmmmmmmmlli10OQ'
      const width = (font) => {
        ctx.font = font
        return ctx.measureText(probe).width
      }
      installed.set(name, ['monospace', 'serif'].some((generic) => width(`72px "${family}", ${generic}`) !== width(`72px ${generic}`)))
    }

    return installed.get(name)
  }

  const renders = new Map()
  function rendered(stack) {
    if (!renders.has(stack)) renders.set(stack, parseStack(stack).find(available) ?? 'the browser default')

    return renders.get(stack)
  }

  const SIDES = ['Top', 'Right', 'Bottom', 'Left']
  const spacingCandidates = []
  let elements = 0

  for (const el of doc.body.querySelectorAll('*')) {
    if (el.closest('script, style, noscript, template')) continue

    const box = el.getBoundingClientRect()
    if (!box.width || !box.height) continue

    const cs = win.getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue

    elements += 1
    const text = ownText(el)

    if (text && checks.has('type')) {
      const size = parseFloat(cs.fontSize)
      const tracked = cs.textTransform === 'uppercase' && parseFloat(cs.letterSpacing) > 0

      if (Math.abs(size - config.label.px) < TOLERANCE && size < config.floor.px) {
        if (!tracked) record('type-floor', `${round(size)}px`, el, { note: `text-${config.label.step} is for uppercase text with letter-spacing only` })
      } else if (size < config.floor.px - TOLERANCE) {
        record('type-floor', `${round(size)}px`, el)
      } else if (!onList(size, typePx)) {
        record('type-scale', `${round(size)}px`, el)
      }
    }

    if (text && checks.has('fonts')) {
      const family = parseStack(cs.fontFamily)[0]
      const name = family.toLowerCase()

      if (!primaries.includes(name)) record('font-family', family, el, { renders: rendered(cs.fontFamily) })
      else if (!served.has(name)) record('font-unserved', family, el, { renders: rendered(cs.fontFamily) })
    }

    if (checks.has('spacing')) {
      const properties = SIDES.flatMap((side) => [`padding${side}`, `margin${side}`])
      if (/flex|grid/.test(cs.display)) properties.push('rowGap', 'columnGap')

      const off = properties.filter((property) => {
        const px = Math.abs(parseFloat(cs[property]))
        return px > config.hairline + TOLERANCE && !onList(px, menuPx)
      })
      if (off.length) spacingCandidates.push([el, off])
    }

    if (palette) {
      const colours = []
      if (text) colours.push(['color', cs.color])
      colours.push(['background-color', cs.backgroundColor])
      for (const side of SIDES) {
        if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== 'none') colours.push(['border-color', cs[`border${side}Color`]])
      }
      if (el instanceof SVGElement) {
        if (/^(#|rgb|hsl|oklch|lab|color)/.test(cs.fill)) colours.push(['fill', cs.fill])
        if (/^(#|rgb|hsl|oklch|lab|color)/.test(cs.stroke)) colours.push(['stroke', cs.stroke])
      }

      const seen = new Set()
      for (const [property, value] of colours) {
        const key = colourKey(value)
        if (!key || palette.has(key) || seen.has(key + property)) continue
        seen.add(key + property)
        record('color', key, el, { property })
      }
    }
  }

  // A rendered element reports margin: auto and percentage padding as the
  // pixels they resolved to. With display: none the same properties report
  // the computed value instead, which is where auto and % are still visible.
  // This runs after the walk so the toggling never interleaves with layout.
  for (const [el, properties] of spacingCandidates) {
    const display = [el.style.getPropertyValue('display'), el.style.getPropertyPriority('display')]
    const computed = new Map(properties.map((property) => [property, win.getComputedStyle(el)[property]]))
    el.style.setProperty('display', 'none', 'important')
    const specified = new Map(properties.map((property) => [property, win.getComputedStyle(el)[property]]))
    el.style.setProperty('display', ...display)
    if (!el.getAttribute('style')) el.removeAttribute('style')

    for (const property of properties) {
      if (!/^-?[\d.]+px$/.test(specified.get(property))) continue

      const name = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      record('spacing', `${round(Math.abs(parseFloat(computed.get(property))))}px`, el, { property: name })
    }
  }

  if (checks.has('fonts')) {
    const external = (url) => {
      try {
        const target = new URL(url, doc.baseURI)
        if (!/^https?:$/.test(target.protocol)) return false

        return location.protocol === 'file:' || target.host !== location.host
      } catch {
        return false
      }
    }

    // The resource timing buffer holds 250 entries by default and a busy
    // page fills it before its fonts arrive, so a caller that watched the
    // network (the CLI does) can pass the requests it saw.
    const urls = new Set()
    const requested = [...performance.getEntriesByType('resource').map((entry) => entry.name), ...(config.requests ?? [])]
    for (const url of requested) {
      if (/\.(woff2?|ttf|otf|eot)(\?|$)|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url) && external(url)) urls.add(url)
    }

    // Declared but not yet requested faces are still a dependency, so read
    // the rules as well as the network log.
    for (const sheet of doc.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        if (sheet.href && external(sheet.href) && /font/i.test(sheet.href)) urls.add(sheet.href)
        continue
      }
      for (const rule of rules) {
        if (!(rule instanceof CSSFontFaceRule)) continue
        for (const [, url] of rule.style.getPropertyValue('src').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
          const absolute = new URL(url, sheet.href ?? doc.baseURI).href
          if (external(absolute)) urls.add(absolute)
        }
      }
    }

    for (const url of urls) record('font-external', new URL(url).host, null, { url })
    for (const group of groups.values()) {
      if (group.check !== 'font-external') continue
      group.samples = [...urls].filter((url) => new URL(url).host === group.value).slice(0, config.samples).map((url) => ({ selector: url, text: '' }))
    }
  }

  const findings = [...groups.values()]
    .map(({ url, property, ...group }) => group)
    .sort((a, b) => a.check.localeCompare(b.check) || b.count - a.count)

  const byCheck = {}
  for (const { check, count } of findings) byCheck[check] = (byCheck[check] ?? 0) + count

  return {
    url: location.href,
    title: doc.title,
    elements,
    total: findings.reduce((sum, { count }) => sum + count, 0),
    byCheck,
    notes,
    findings,
  }
}
