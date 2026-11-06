import { noop } from '@tanstack/query-core'
import type {
  DevtoolsPanelOptions,
  DevtoolsPanelRef,
  InjectDevtoolsPanel,
} from './types'

/**
 * Replaces `injectDevtoolsPanel` in production builds: returns a panel whose `destroy` does nothing.
 * @returns A devtools panel that does nothing.
 */
export const injectDevtoolsPanel: InjectDevtoolsPanel = () => ({
  destroy: noop,
})

export type { InjectDevtoolsPanel, DevtoolsPanelOptions, DevtoolsPanelRef }
