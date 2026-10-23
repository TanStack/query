<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import type { Accessor, CreateQueryOptions } from '../../src/index.js'

  type Props = {
    options: Accessor<CreateQueryOptions>
  }

  let { options }: Props = $props()

  const query = createQuery(options)
</script>

<div data-testid="status">{query.status}</div>
