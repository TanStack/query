<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createQuery, setQueryClientContext } from '../../src/index.js'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Data = { name: string }

  type Props = {
    queryClient: QueryClient
    options: Accessor<CreateQueryOptions<Data, Error, string>>
  }

  let { queryClient, options }: Props = $props()

  setQueryClientContext(queryClient)

  const query = createQuery<Data, Error, string>(options)
</script>

<div data-testid="status">{query.status}</div>
<div data-testid="data">{query.data ?? 'undefined'}</div>
<div data-testid="error">
  {(query.error as Error | null)?.message ?? 'null'}
</div>
