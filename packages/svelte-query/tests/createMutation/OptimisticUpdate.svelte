<script lang="ts">
  import {
    cancelQueries,
    getQueryData,
    setQueryData,
  } from '@tanstack/query-core'
  import { sleep } from '@tanstack/query-test-utils'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import type { QueryClient } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
    queryKey: Array<string>
    shouldSucceed: boolean
  }

  let { queryClient, queryKey, shouldSucceed }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (newTodo: string) =>
      shouldSucceed
        ? sleep(10).then(() => newTodo)
        : sleep(10).then(() => Promise.reject(new Error('Some error'))),
    onMutate: async (newTodo: string) => {
      await cancelQueries(queryClient, { queryKey })
      const previousTodos = getQueryData<Array<string>>(queryClient, queryKey)

      setQueryData<Array<string>>(queryClient, queryKey, (old) => [
        ...(old ?? []),
        newTodo,
      ])

      return { previousTodos }
    },
    onError: (_err, _newTodo, onMutateResult) => {
      setQueryData(queryClient, queryKey, onMutateResult?.previousTodos)
    },
  }))
</script>

<button onclick={() => mutation.mutate('Todo 2')}>add</button>
