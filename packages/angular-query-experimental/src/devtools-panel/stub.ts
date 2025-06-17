import { noop } from '@tanstack/query-core'
import type { InjectDevtoolsPanel } from './types'

// Stub which replaces `injectDevtoolsPanel` in production builds
export const injectDevtoolsPanel: InjectDevtoolsPanel = () => ({
  destroy: noop,
})
