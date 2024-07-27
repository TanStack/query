<script lang="ts">
  import { createQuery } from '../../src/createQuery'
  import { sleep } from '../utils.svelte'

  const query = createQuery(() => ({
    queryKey: ['hello'],
    queryFn: async () => {
      await sleep(5)
      return 'test'
    },
  }))
</script>

<div>Data: {query.data ?? 'undefined'}</div>
