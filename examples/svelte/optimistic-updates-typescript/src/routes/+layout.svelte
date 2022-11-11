<script lang="ts">
	import { setQueryClient } from '@tanstack/svelte-query';
	import '../app.css';
	setQueryClient();
</script>

<main>
	<slot />
</main>
