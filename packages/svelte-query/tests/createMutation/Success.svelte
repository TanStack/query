<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    onSuccessMock: (data: number) => void
    onSettledMock: (data: number | undefined) => void
  }

  const { queryClient, onSettledMock, onSuccessMock }: Props = $props()

  let count = $state(0)

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (vars: { count: number }) => sleep(10).then(() => vars.count),
    onSuccess: (data) => {
      onSuccessMock(data)
    },
    onSettled: (data) => {
      onSettledMock(data)
    },
  }))
</script>

<button onclick={() => mutation.mutate({ count: ++count })}>Mutate</button>

<div>Count: {count}</div>
