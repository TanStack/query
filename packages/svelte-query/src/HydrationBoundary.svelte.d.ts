import { SvelteComponentTyped } from 'svelte'
import type {
  DehydratedState,
  HydrateOptions,
  QueryClient,
} from '@tanstack/query-core'
declare const __propDef: {
  props: {
    state: DehydratedState
    options?: HydrateOptions | undefined
    queryClient?: QueryClient | undefined
  }
  events: {
    [evt: string]: CustomEvent<any>
  }
  slots: {
    default: {}
  }
}
export type HydrationBoundaryProps = typeof __propDef.props
export type HydrationBoundaryEvents = typeof __propDef.events
export type HydrationBoundarySlots = typeof __propDef.slots
export default class HydrationBoundary extends SvelteComponentTyped<
  HydrationBoundaryProps,
  HydrationBoundaryEvents,
  HydrationBoundarySlots
> {}
export {}
//# sourceMappingURL=HydrationBoundary.svelte.d.ts.map
