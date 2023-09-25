<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'
  import {
    staleTime,
    gcTime,
    errorRate,
    queryTimeMin,
    queryTimeMax,
  } from '../lib/stores'
  import App from './App.svelte'

  const queryClient = useQueryClient()

  queryClient.setDefaultOptions({
    queries: {
      staleTime: $staleTime,
      gcTime: $gcTime,
    },
  })
</script>

<p>
  The "staleTime" and "gcTime" durations have been altered in this example to
  show how query stale-ness and query caching work on a granular level
</p>
<div>
  Stale Time:{' '}
  <input
    type="number"
    min="0"
    step="1000"
    bind:value={$staleTime}
    style="width: 100px"
  />
</div>
<div>
  GcTime:{' '}
  <input
    type="number"
    min="0"
    step="1000"
    bind:value={$gcTime}
    style="width: 100px"
  />
</div>
<br />
<div>
  Error Rate:{' '}
  <input
    type="number"
    min="0"
    max="1"
    step=".05"
    bind:value={$errorRate}
    style="width: 100px"
  />
</div>
<div>
  Fetch Time Min:{' '}
  <input
    type="number"
    min="1"
    step="500"
    bind:value={$queryTimeMin}
    style="width: 100px"
  />{' '}
</div>
<div>
  Fetch Time Max:{' '}
  <input
    type="number"
    min="1"
    step="500"
    bind:value={$queryTimeMax}
    style="width: 100px"
  />
</div>

<br />
<App />
<br />
