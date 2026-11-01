import { For, Match, Show, Switch } from 'solid-js'
import { useInfiniteQuery } from '@tanstack/solid-query'
import { productsQueries } from './services/products/queries'

type Product = {
  name: string
  shortDescription: string
  salePrice: number
}

type SearchResultsProps = {
  query: string
}

export default function SearchResults(props: SearchResultsProps) {
  const query = useInfiniteQuery(() => ({
    ...productsQueries.search<Product>({
      indexName: 'bestbuy',
      query: props.query,
      hitsPerPage: 5,
    }),
    staleTime: 30 * 1000, // 30s
    gcTime: 15 * 60 * 1000, // 15m
  }))

  const hits = () => query.data?.pages.flatMap((page) => page.hits)

  return (
    <Show when={props.query}>
      <Switch>
        <Match when={query.isLoading}>
          <div class="loading">Loading...</div>
        </Match>
        <Match when={query.status === 'error'}>
          <div>Error: {query.error?.message}</div>
        </Match>
        <Match when={true}>
          <div>
            <div class="search-status">
              Status: {query.status}{' '}
              <Show when={query.isFetching}>
                <span>fetching...</span>
              </Show>
            </div>
            <div>
              <div class="search-result">
                <Show
                  when={hits()?.length}
                  fallback={<h3>No products found!</h3>}
                >
                  <For each={hits()}>
                    {(product) => (
                      <li class="product">
                        <span class="product-name">{product.name}</span>
                        <Show when={product.shortDescription}>
                          <br />
                          <span class="product-description">
                            {product.shortDescription}
                          </span>
                        </Show>
                        <br />
                        <span class="product-price">${product.salePrice}</span>
                      </li>
                    )}
                  </For>
                </Show>
              </div>
              <Show when={query.hasNextPage}>
                <button
                  type="button"
                  class="search-more"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetching}
                >
                  more
                </button>
              </Show>
              <Show when={query.isFetchingNextPage}>
                <div class="search-status">Fetching next page...</div>
              </Show>
            </div>
          </div>
        </Match>
      </Switch>
    </Show>
  )
}
