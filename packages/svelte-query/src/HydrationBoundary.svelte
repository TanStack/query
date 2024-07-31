<script lang="ts">
  import { useHydrate } from './useHydrate.js'
  import type {
    DehydratedState,
    HydrateOptions,
    QueryClient,
  } from '@tanstack/query-core'

  export let state: DehydratedState
  export let options: HydrateOptions | undefined = undefined
  export let queryClient: QueryClient | undefined = undefined

  useHydrate(state, options, queryClient)
</script>

<slot />
