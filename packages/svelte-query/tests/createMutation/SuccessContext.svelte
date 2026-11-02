<script lang="ts">
  import type {
    MutationFunctionContext,
    MutationKey,
    QueryClient,
  } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    mutationKey?: MutationKey
    onSuccessMock: (
      data: string,
      variables: string,
      onMutateResult: { startedWith: string },
      context: MutationFunctionContext,
    ) => void
  }

  let { queryClient, mutationKey, onSuccessMock }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationKey,
    mutationFn: (text: string) => sleep(10).then(() => text.toUpperCase()),
    onMutate: (text: string) => ({ startedWith: text }),
    onSuccess: onSuccessMock,
  }))
</script>

<button onclick={() => mutation.mutate('todo')}>Mutate</button>
