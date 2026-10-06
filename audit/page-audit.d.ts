// Copyright (c) 2026 Sidero Labs, Inc.

/** The checks `auditPage` runs when `checks` is omitted: all of them. */
export type AuditCheckGroup = 'type' | 'spacing' | 'fonts' | 'color' | 'roles'

/** What a finding reports. One check group can report several of these. */
export type AuditCheck =
  | 'type-floor'
  | 'type-scale'
  | 'font-family'
  | 'font-unserved'
  | 'font-external'
  | 'spacing'
  | 'color'
  | 'status-control'
  | 'accent-in-table'

export interface ScaleStep {
  step: string
  px: number
}

/** The shape of `dist/tokens.json`, as far as the audit reads it. */
export interface Tokens {
  prefix: string
  primitive: Record<string, { value: string, type?: string }>
  semantic: Record<string, Record<string, { value: string, type?: string }>>
}

export interface AuditConfig {
  prefix: string
  typeScale: ScaleStep[]
  floor: ScaleStep
  label: ScaleStep
  spacing: ScaleStep[]
  hairline: number
  stacks: { sans: string[], mono: string[] }
  colorRoles: string[]
  statusStates: string[]
  samples: number
  /** Limits the run to these groups. */
  checks?: AuditCheckGroup[]
  /** Font requests the caller saw on the network, beyond the resource timing buffer. */
  requests?: string[]
}

export interface AuditSample {
  selector: string
  text: string
}

export interface AuditFinding {
  check: AuditCheck
  value: string
  count: number
  samples: AuditSample[]
  /** For `spacing` and `color`: how many hits each CSS property had. */
  properties: Record<string, number>
  /** For `font-family` and `font-unserved`: the face the browser fell back to. */
  renders?: string
  note?: string
}

export interface AuditReport {
  url: string
  title: string
  elements: number
  total: number
  byCheck: Partial<Record<AuditCheck, number>>
  notes: string[]
  findings: AuditFinding[]
}

export declare function configFromTokens(tokens: Tokens, options?: { samples?: number }): AuditConfig

/** Runs in the page. Self-contained, so it can be passed to Playwright's `page.evaluate`. */
export declare function auditPage(config: AuditConfig): AuditReport
