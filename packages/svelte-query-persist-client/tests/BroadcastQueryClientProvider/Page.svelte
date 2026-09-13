<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let {
    onFetch,
    staleTime = Infinity,
  }: { onFetch: () => void; staleTime?: number } = $props()

  const query = createQuery(() => ({
    queryKey: ['broadcast-bootstrap'],
    queryFn: async () => {
      onFetch()
      return 'network'
    },
    staleTime,
  }))
</script>

<div>{query.data ?? query.fetchStatus}</div>
