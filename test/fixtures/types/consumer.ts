// Copyright (c) 2026 Sidero Labs, Inc.
//
// Imports every typed entry point the way a product does. The test compiles
// this and fails on any error, so a declaration that drifts from its module's
// shape, or stops resolving through `exports`, breaks the build here first.

import type { Config } from 'stylelint'
import type { ESLint, Rule } from 'eslint'

import designSystemDefault, { designSystem } from '@siderolabs/talos-design-system/eslint'
import talos from '@siderolabs/talos-design-system/stylelint'
import { auditPage, configFromTokens, type AuditReport, type Tokens } from '@siderolabs/talos-design-system/audit'

const plugin: ESLint.Plugin = designSystem
const rule: Rule.RuleModule = designSystemDefault.rules['no-raw-color']
const stylelintConfig: Config = talos

declare const tokens: Tokens
const config = configFromTokens(tokens, { samples: 5 })
const report: AuditReport = auditPage({ ...config, checks: ['type', 'color'], requests: [] })
const floor: number = config.floor.px
const counts: number | undefined = report.byCheck['type-floor']

export { plugin, rule, stylelintConfig, floor, counts }
