import { SvelteComponentTyped } from 'svelte'
import { QueryClient } from '@tanstack/query-core'
declare const __propDef: {
  props: {
    client?: QueryClient
  }
  events: {
    [evt: string]: CustomEvent<any>
  }
  slots: {
    default: {}
  }
}
export type QueryClientProviderProps = typeof __propDef.props
export type QueryClientProviderEvents = typeof __propDef.events
export type QueryClientProviderSlots = typeof __propDef.slots
export default class QueryClientProvider extends SvelteComponentTyped<
  QueryClientProviderProps,
  QueryClientProviderEvents,
  QueryClientProviderSlots
> {}
export {}
//# sourceMappingURL=QueryClientProvider.svelte.d.ts.map
