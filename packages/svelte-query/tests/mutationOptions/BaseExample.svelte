<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import {
    createMutation,
    setQueryClientContext,
    useIsMutating,
    useMutationState,
  } from '../../src/index.js'
  import type {
    Accessor,
    CreateMutationOptions,
    MutationStateOptions,
  } from '../../src/index.js'
  import type { MutationFilters } from '@tanstack/query-core'

  let {
    mutationOpts,
    isMutatingFilters,
    mutationStateOpts,
  }: {
    mutationOpts: Accessor<CreateMutationOptions<string, Error, void, unknown>>
    isMutatingFilters?: MutationFilters
    mutationStateOpts?: MutationStateOptions
  } = $props()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(mutationOpts)
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

<button onclick={() => mutation.mutate()}>mutate</button>

<div>isMutating: {isMutating.current}</div>
<div>clientIsMutating: {clientIsMutating}</div>
<div>
  mutationState: {JSON.stringify(mutationState.map((state) => state.data))}
</div>
