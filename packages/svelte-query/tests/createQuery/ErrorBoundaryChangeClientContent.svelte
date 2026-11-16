<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import type { QueryClient } from '@tanstack/query-core'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Props = {
    currentClient: Accessor<QueryClient>
    options: Accessor<CreateQueryOptions>
  }

  let { currentClient, options }: Props = $props()

  const query = createQuery(options, currentClient)
</script>

<div data-testid="status">{query.status}</div>
