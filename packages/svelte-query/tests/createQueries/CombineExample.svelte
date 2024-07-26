<script lang="ts">
  import { createQueries } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'
  import type { QueryClient } from '@tanstack/query-core'

  export let queryClient: QueryClient

  const ids = [1, 2, 3]

  const queries = createQueries(
    {
      queries: () =>
        ids.map((id) => ({
          queryKey: [id],
          queryFn: async () => {
            await sleep(5)
            return id
          },
        })),
      combine: (results) => {
        return {
          isPending: results.some((result) => result.isPending),
          isSuccess: results.every((result) => result.isSuccess),
          data: results.map((res) => res.data).join(','),
        }
      },
    },
    queryClient,
  )
</script>

<div>isPending: {queries.isPending}</div>
<div>Data: {queries.data}</div>
