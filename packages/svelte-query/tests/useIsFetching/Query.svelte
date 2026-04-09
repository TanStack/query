<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  let ready = $state(false)

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: () => sleep(10).then(() => 'test'),
    enabled: ready,
  }))
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>Data: {query.data ?? 'undefined'}</div>
