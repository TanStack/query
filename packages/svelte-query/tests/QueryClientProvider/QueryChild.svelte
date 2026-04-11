<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const query = createQuery(() => ({
    queryKey: ['hello'],
    queryFn: () => sleep(10).then(() => 'test'),
  }))
</script>

<div>Data: {query.data ?? 'undefined'}</div>
