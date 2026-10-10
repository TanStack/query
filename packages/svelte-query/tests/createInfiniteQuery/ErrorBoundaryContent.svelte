<script lang="ts">
  import { createInfiniteQuery } from '../../src/index.js'
  import type { Accessor, CreateInfiniteQueryOptions } from '../../src/types.js'

  type Props = {
    options: Accessor<CreateInfiniteQueryOptions>
  }

  let { options }: Props = $props()

  const query = createInfiniteQuery(options)
</script>

<div data-testid="status">{query.status}</div>
