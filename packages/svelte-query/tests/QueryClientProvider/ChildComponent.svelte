<script lang="ts">
  import { createQuery } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'

  const query = createQuery(() => ({
    queryKey: ['hello'],
    queryFn: async () => {
      await sleep(5)
      return 'test'
    },
  }))
</script>

<div>Data: {query.data ?? 'undefined'}</div>
