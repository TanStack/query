<script lang="ts">
  import { sleep } from '@tanstack/query-test-utils'
  import { createQuery } from '../../src/index.js'

  const query = createQuery(() => ({
    queryKey: ['hello'],
    queryFn: () => sleep(10).then(() => 'test'),
  }))
</script>

<div>Data: {query.data ?? 'undefined'}</div>
