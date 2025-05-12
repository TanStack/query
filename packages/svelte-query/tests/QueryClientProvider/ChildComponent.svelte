<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const query = createQuery(() => ({
    queryKey: ['hello'],
    queryFn: async () => {
      await sleep(5)
      return 'test'
    },
  }))
</script>

<div>Data: {query.data ?? 'undefined'}</div>
