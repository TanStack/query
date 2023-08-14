<script lang="ts">
  import { useHydrate } from './useHydrate'
  import type { DehydratedState, HydrateOptions } from '@tanstack/query-core'

  export let state: DehydratedState
  export let options: HydrateOptions | undefined = undefined

  useHydrate(state, options)
</script>

<slot />
