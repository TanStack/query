<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import { productsQueries } from './services/products/queries'

  type Product = {
    name: string
    shortDescription: string
    salePrice: number
  }

  type Props = {
    query: string
  }

  let { query = '' }: Props = $props()

  const searchQuery = createInfiniteQuery(() => ({
    ...productsQueries.search<Product>({
      indexName: 'bestbuy',
      query,
      hitsPerPage: 5,
    }),
    select: (data) => data.pages.flatMap((page) => page.hits),
    staleTime: 30 * 1000, // 30s
    gcTime: 15 * 60 * 1000, // 15m
  }))
</script>

{#if query}
  {#if searchQuery.isLoading}
    <div class="loading">Loading...</div>
  {:else if searchQuery.status === 'error'}
    <div>Error: {searchQuery.error.message}</div>
  {:else}
    <div>
      <div class="search-status">
        Status: {searchQuery.status}
        {#if searchQuery.isFetching}<span>fetching...</span>{/if}
      </div>
      <div>
        <div class="search-result">
          {#if searchQuery.data && searchQuery.data.length > 0}
            {#each searchQuery.data as product (product.objectID)}
              <li class="product">
                <span class="product-name">{product.name}</span>
                {#if product.shortDescription}
                  <br />
                  <span class="product-description">
                    {product.shortDescription}
                  </span>
                {/if}
                <br />
                <span class="product-price">${product.salePrice}</span>
              </li>
            {/each}
          {:else}
            <h3>No products found!</h3>
          {/if}
        </div>
        {#if searchQuery.hasNextPage}
          <button
            type="button"
            class="search-more"
            onclick={() => searchQuery.fetchNextPage()}
            disabled={searchQuery.isFetching}
          >
            more
          </button>
        {/if}
        {#if searchQuery.isFetchingNextPage}
          <div class="search-status">Fetching next page...</div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
