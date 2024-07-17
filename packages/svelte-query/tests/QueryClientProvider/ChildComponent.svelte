<script lang="ts">
  import { createQuery } from '../../src/createQuery'
  import { sleep } from '../utils.svelte'

  const query = createQuery({
    queryKey: ['hello'],
    queryFn: async () => {
      await sleep(10)
      return 'test'
    },
  })
</script>

<div>{query.data}</div>
