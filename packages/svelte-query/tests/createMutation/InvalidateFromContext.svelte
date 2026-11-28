<script lang="ts">
  import { invalidateQueries } from '@tanstack/query-core'
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
    mutationFn: () => sleep(10).then(() => 'mutated'),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      invalidateQueries(context.client, { queryKey })
    },
  }))
</script>

<button onclick={() => mutation.mutate()}>Mutate</button>
