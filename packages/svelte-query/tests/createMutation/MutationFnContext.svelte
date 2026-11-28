<script lang="ts">
  import { getQueryData } from '@tanstack/query-core'
  import { sleep } from '@tanstack/query-test-utils'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import type { QueryClient, QueryKey } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
    queryKey: QueryKey
  }

  let { queryClient, queryKey }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (_text: string, context) =>
      sleep(10).then(() => getQueryData(context.client, queryKey)),
  }))
</script>

<button onclick={() => mutation.mutate('todo')}>Mutate</button>

<div>data: {mutation.data}</div>
