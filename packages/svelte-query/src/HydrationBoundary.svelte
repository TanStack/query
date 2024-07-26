<script lang="ts">
  import { useHydrate } from './useHydrate.js'
  import type { Snippet } from 'svelte'
  import type {
    DehydratedState,
    HydrateOptions,
    QueryClient,
  } from '@tanstack/query-core'

  type Props = {
    children: Snippet
    state: DehydratedState
    options: HydrateOptions | undefined
    queryClient: QueryClient | undefined
  }

  const {
    children,
    state,
    options = undefined,
    queryClient = undefined,
  }: Props = $props()

  useHydrate(state, options, queryClient)
</script>

{@render children()}
