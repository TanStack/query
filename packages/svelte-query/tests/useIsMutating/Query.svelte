<script lang="ts">
  import { createMutation } from '../../src/index.js'
  import { queryKey, sleep } from '@tanstack/query-test-utils'

  const mutation = createMutation(() => ({
    mutationKey: queryKey(),
    mutationFn: () => sleep(10).then(() => 'data'),
  }))
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>
