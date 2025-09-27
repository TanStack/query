<script lang="ts">
  import { useIsFetching } from '../../src/index.js'
  const isFetching = useIsFetching()
</script>

<div>isFetching: {isFetching.current}</div>
