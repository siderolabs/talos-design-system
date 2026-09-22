// Copyright (c) 2026 Sidero Labs, Inc.

/**
 * Utility classes reach the DOM from several places: a static `class` or
 * `className` attribute, a string or template literal inside a binding, and
 * `cn()`/`clsx()` calls in script. Rather than enumerate those shapes, this
 * inspects every string in the file and only reports one when it contains a
 * class the rule recognises, so ordinary strings pass through untouched.
 *
 * Works for React/TSX out of the box. In a Vue SFC it also walks the template
 * half via vue-eslint-parser's `defineTemplateBodyVisitor`.
 */
export function createClassStringRule(check) {
  return (context) => {
    const inspect = (node, raw) => {
      if (!raw.includes('-')) return

      for (const candidate of raw.split(/\s+/)) {
        if (!candidate) continue

        const message = check(candidate)
        if (message) context.report({ node, message })
      }
    }

    const stringVisitor = {
      Literal(node) {
        if (typeof node.value === 'string') inspect(node, node.value)
      },
      TemplateElement(node) {
        inspect(node, node.value.cooked ?? node.value.raw)
      },
    }

    const services = context.sourceCode.parserServices

    // Plain .ts/.tsx files have no template half.
    if (!services?.defineTemplateBodyVisitor) return stringVisitor

    return services.defineTemplateBodyVisitor(
      {
        ...stringVisitor,
        VAttribute(node) {
          if (node.directive || node.key.name !== 'class') return
          if (!node.value?.value) return

          inspect(node.value, node.value.value)
        },
      },
      stringVisitor,
    )
  }
}

/**
 * Strips Tailwind variant prefixes (`md:`, `hover:`, `dark:`), the `!`
 * important marker and any trailing opacity modifier (`/50`), so the rules
 * only have to reason about the utility itself.
 */
export function bareUtility(className) {
  const withoutVariants = className.slice(className.lastIndexOf(':') + 1)
  const withoutImportant = withoutVariants.replace(/^!/, '')

  return withoutImportant.replace(/\/[0-9.]+$/, '')
}
