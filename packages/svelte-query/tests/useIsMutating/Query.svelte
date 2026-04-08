<script lang="ts">
  import { createMutation } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const mutation = createMutation(() => ({
    mutationKey: ['mutation-1'],
    mutationFn: () => sleep(10).then(() => 'data'),
  }))
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>
