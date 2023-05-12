<script lang="ts">
  import { setContext, onMount } from "svelte";
  import { QueryClient, createQuery } from "@tanstack/svelte-query";

  import { SvelteQueryDevtools } from "$lib";

  const queryClient = new QueryClient({});
  setContext("$$_queryClient", queryClient);

  onMount(() => {
    queryClient.mount();
    return () => queryClient.unmount();
  });

  const query = createQuery({
    queryKey: ["test"],
    queryFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              hello: "world",
              nested: {
                boolean: true,
                array: [{ key: "value" }],
              },
            },
          });
        }, 500);
      });
    },
  });
</script>

{JSON.stringify($query.data)}
<button on:click={() => $query.refetch()}>refetch</button>
<SvelteQueryDevtools />
