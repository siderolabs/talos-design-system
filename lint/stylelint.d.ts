// Copyright (c) 2026 Sidero Labs, Inc.

import type { Config } from 'stylelint'

declare const config: Config & {
  rules: NonNullable<Config['rules']>
  overrides: NonNullable<Config['overrides']>
}

export default config
