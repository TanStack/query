<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  let ready = $state(false)

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      return 'test'
    },
    enabled: ready,
  }))
</script>

<button onclick={() => (ready = true)}>setReady</button>

<div>Data: {query.data ?? 'undefined'}</div>
