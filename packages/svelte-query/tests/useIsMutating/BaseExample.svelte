<script lang="ts">
  import ProviderWrapper from '../ProviderWrapper.svelte'
  import MutatingStatus from './MutatingStatus.svelte'
  import Query from './Query.svelte'
</script>

<ProviderWrapper>
  <MutatingStatus />

  <Query />
</ProviderWrapper>
