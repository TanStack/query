<script lang="ts">
  import {
    getMutationCache,
    isMutating as queryIsMutating,
  } from '@tanstack/query-core'
  import {
    createMutation,
    setQueryClientContext,
    useIsMutating,
    useMutationState,
  } from '../../src/index.js'
  import type { MutationFilters, QueryClient } from '@tanstack/query-core'
  import type {
    Accessor,
    CreateMutationOptions,
    MutationStateOptions,
  } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    mutationOpts: Accessor<CreateMutationOptions<string>>
    isMutatingFilters?: MutationFilters
    mutationStateOpts?: MutationStateOptions
  }

  let {
    queryClient,
    mutationOpts,
    isMutatingFilters,
    mutationStateOpts,
  }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(mutationOpts)
  const isMutating = useIsMutating(isMutatingFilters)
  const mutationState = useMutationState(mutationStateOpts)

  let clientIsMutating = $state(0)

  $effect(() => {
    const mutationCache = getMutationCache(queryClient)
    clientIsMutating = isMutatingFilters
      ? queryIsMutating(queryClient, isMutatingFilters)
      : queryIsMutating(queryClient)

    const unsubscribe = mutationCache.subscribe(() => {
      clientIsMutating = isMutatingFilters
        ? queryIsMutating(queryClient, isMutatingFilters)
        : queryIsMutating(queryClient)
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
