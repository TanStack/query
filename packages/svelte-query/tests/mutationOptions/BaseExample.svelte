<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    createMutation,
    setQueryClientContext,
    useIsMutating,
    useMutationState,
  } from '../../src/index.js'
  import type {
    CreateMutationOptions,
    MutationStateOptions,
  } from '../../src/index.js'
  import type { MutationFilters } from '@tanstack/query-core'

  let {
    mutationOpts1,
    mutationOpts2,
    isMutatingFilters,
    mutationStateOpts,
  }: {
    mutationOpts1: CreateMutationOptions<string, Error, void, unknown>
    mutationOpts2?: CreateMutationOptions<string, Error, void, unknown>
    isMutatingFilters?: MutationFilters
    mutationStateOpts?: MutationStateOptions
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation1 = createMutation(() => mutationOpts1)
  const mutation2 = mutationOpts2
    ? createMutation(() => mutationOpts2!)
    : undefined
  const isMutating = useIsMutating(isMutatingFilters)
  const mutationState = useMutationState(mutationStateOpts)

  let clientIsMutating = $state(0)

  $effect(() => {
    const mutationCache = queryClient.getMutationCache()
    clientIsMutating = isMutatingFilters
      ? queryClient.isMutating(isMutatingFilters)
      : queryClient.isMutating()

    const unsubscribe = mutationCache.subscribe(() => {
      clientIsMutating = isMutatingFilters
        ? queryClient.isMutating(isMutatingFilters)
        : queryClient.isMutating()
    })

    return unsubscribe
  })
</script>

<button onclick={() => mutation1.mutate()}>mutate1</button>
{#if mutation2}
  <button onclick={() => mutation2.mutate()}>mutate2</button>
{/if}

<div>isMutating: {isMutating.current}</div>
<div>clientIsMutating: {clientIsMutating}</div>
<div>
  mutationState: {JSON.stringify(mutationState.map((state) => state.data))}
</div>
