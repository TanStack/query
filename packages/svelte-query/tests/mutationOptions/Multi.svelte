<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
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

  type Props = {
    queryClient: QueryClient
    mutationOpts1: Accessor<CreateMutationOptions<string>>
    mutationOpts2: Accessor<CreateMutationOptions<string>>
    isMutatingFilters?: MutationFilters
    mutationStateOpts?: MutationStateOptions
  }

  let {
    queryClient,
    mutationOpts1,
    mutationOpts2,
    isMutatingFilters,
    mutationStateOpts,
  }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation1 = createMutation(mutationOpts1)
  const mutation2 = createMutation(mutationOpts2)
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
<button onclick={() => mutation2.mutate()}>mutate2</button>

<div>isMutating: {isMutating.current}</div>
<div>clientIsMutating: {clientIsMutating}</div>
<div>
  mutationState: {JSON.stringify(mutationState.map((state) => state.data))}
</div>
