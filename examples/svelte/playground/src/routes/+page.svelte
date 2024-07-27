<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'
  import {
    staleTime,
    gcTime,
    errorRate,
    queryTimeMin,
    queryTimeMax,
  } from '../lib/stores.svelte'
  import App from './App.svelte'

  const queryClient = useQueryClient()

  queryClient.setDefaultOptions({
    queries: {
      staleTime: staleTime.value,
      gcTime: gcTime.value,
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
    bind:value={staleTime.value}
    style="width: 100px"
  />
</div>
<div>
  GcTime:{' '}
  <input
    type="number"
    min="0"
    step="1000"
    bind:value={gcTime.value}
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
    bind:value={errorRate.value}
    style="width: 100px"
  />
</div>
<div>
  Fetch Time Min:{' '}
  <input
    type="number"
    min="1"
    step="500"
    bind:value={queryTimeMin.value}
    style="width: 100px"
  />{' '}
</div>
<div>
  Fetch Time Max:{' '}
  <input
    type="number"
    min="1"
    step="500"
    bind:value={queryTimeMax.value}
    style="width: 100px"
  />
</div>

<br />
<App />
<br />
