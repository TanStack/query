<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    queryKey: Array<string>
    shouldSucceed: boolean
  }

  const { queryClient, queryKey, shouldSucceed }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (newTodo: string) =>
      shouldSucceed
        ? sleep(10).then(() => newTodo)
        : sleep(10).then(() => Promise.reject(new Error('Some error'))),
    onMutate: async (newTodo: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previousTodos = queryClient.getQueryData<Array<string>>(queryKey)

      queryClient.setQueryData<Array<string>>(queryKey, (old) => [
        ...(old ?? []),
        newTodo,
      ])

      return { previousTodos }
    },
    onError: (_err, _newTodo, onMutateResult) => {
      queryClient.setQueryData(queryKey, onMutateResult?.previousTodos)
    },
  }))
</script>

<button onclick={() => mutation.mutate('Todo 2')}>add</button>
