<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    onSuccessMock: any
    onSettledMock: any
  }

  const { onSettledMock, onSuccessMock }: Props = $props()

  let count = $state(0)

  const queryClient = new QueryClient()
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
