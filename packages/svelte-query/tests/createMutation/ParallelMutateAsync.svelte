<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    strategy: 'all' | 'allSettled'
    failOn?: string
  }

  const { queryClient, strategy, failOn }: Props = $props()

  let result = $state('idle')

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (file: string) =>
      sleep(10).then(() => {
        if (file === failOn) {
          throw new Error('upload failed')
        }
        return `uploaded: ${file}`
      }),
    retry: false,
  }))

  async function uploadAll() {
    if (strategy === 'all') {
      try {
        const results = await Promise.all([
          mutation.mutateAsync('file1'),
          mutation.mutateAsync('file2'),
          mutation.mutateAsync('file3'),
        ])
        result = results.join(', ')
      } catch (error) {
        result = `error: ${(error as Error).message}`
      }
    } else {
      const results = await Promise.allSettled([
        mutation.mutateAsync('file1'),
        mutation.mutateAsync('file2'),
        mutation.mutateAsync('file3'),
      ])
      result = results
        .map((r) =>
          r.status === 'fulfilled' ? r.value : `error: ${r.reason.message}`,
        )
        .join(', ')
    }
  }
</script>

<button onclick={uploadAll}>upload all</button>

<div>result: {result}</div>
