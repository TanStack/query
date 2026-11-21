<script lang="ts">
  import { page } from '$app/state'
</script>

<div id="error-page">
  <h1>Oops!</h1>
  <p>Sorry, an unexpected error has occurred.</p>
  <p>
    <i>{page.error?.message}</i>
  </p>
</div>
