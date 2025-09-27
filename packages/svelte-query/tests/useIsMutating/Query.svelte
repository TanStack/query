<script lang="ts">
  import { createMutation } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  const mutation = createMutation(() => ({
    mutationKey: ['mutation-1'],
    mutationFn: async () => {
      await sleep(10)
      return 'data'
    },
  }))
</script>

<button onclick={() => mutation.mutate()}>Trigger</button>
