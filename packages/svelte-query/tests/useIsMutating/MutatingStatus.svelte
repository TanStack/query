<script lang="ts">
  import { useIsMutating } from '../../src/index.js'
  const isMutating = useIsMutating()
</script>

<div>isMutating: {isMutating.current}</div>
