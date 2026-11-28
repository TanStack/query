<script lang="ts">
  import { isError, isFetching } from '@tanstack/query-core'
  import {
    createInfiniteQuery,
    setQueryClientContext,
  } from '../../src/index.js'
  import type { QueryClient } from '@tanstack/query-core'
  import type { Accessor, CreateInfiniteQueryOptions } from '../../src/index.js'

  type Props = {
    queryClient: QueryClient
    options: Accessor<CreateInfiniteQueryOptions<any, any, any, any, any>>
  }

  let { queryClient, options }: Props = $props()

  setQueryClientContext(queryClient)

  const query = createInfiniteQuery(options)
</script>

<div data-testid="status">{query.status}</div>
<div data-testid="isError">{isError(query)}</div>
<div data-testid="isFetching">{isFetching(query)}</div>
<div data-testid="pages">{query.data?.pages.join(', ') ?? 'none'}</div>
