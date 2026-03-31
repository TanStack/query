<script lang="ts">
  import ProviderWrapper from '../ProviderWrapper.svelte'
  import FetchStatus from './FetchStatus.svelte'
  import Query from './Query.svelte'
</script>

<ProviderWrapper>
  <FetchStatus />

  <Query />
</ProviderWrapper>
