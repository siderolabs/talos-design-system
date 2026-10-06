// Copyright (c) 2026 Sidero Labs, Inc.

import type { ESLint, Rule } from 'eslint'

export type DesignSystemRule = 'no-off-menu-spacing' | 'no-primitive-token' | 'no-raw-color' | 'no-raw-font-size'

export declare const designSystem: Omit<ESLint.Plugin, 'rules'> & {
  rules: Record<DesignSystemRule, Rule.RuleModule>
}

export default designSystem
