import {
  infiniteQueryOptions,
  isFetching,
  isFetchingNextPage,
  isLoading,
  select,
  useQuery,
} from '@tanstack/preact-query'
import { productsQueries } from './services/products/queries'

type Product = {
  name: string
  shortDescription: string
  salePrice: number
}

type SearchResultsProps = {
  query: string
}

export default function SearchResults({ query = '' }: SearchResultsProps) {
  const infiniteQueryResult = useQuery(
    infiniteQueryOptions({
      ...productsQueries.search<Product>({
        indexName: 'bestbuy',
        query,
        hitsPerPage: 5,
      }),
      select: select((data) => data.pages.flatMap((page) => page.hits)),
      staleTime: 30 * 1000, // 30s
      gcTime: 15 * 60 * 1000, // 15m
    }),
  )

  if (!query) return null

  if (isLoading(infiniteQueryResult))
    return <div className="loading">Loading...</div>

  if (infiniteQueryResult.status === 'error')
    return <div>Error: {infiniteQueryResult.error.message}</div>

  return (
    <div>
      <div className="search-status">
        Status: {infiniteQueryResult.status}{' '}
        {isFetching(infiniteQueryResult) && <span>fetching...</span>}
      </div>
      <div>
        <div className="search-result">
          {infiniteQueryResult.data && infiniteQueryResult.data.length > 0 ? (
            infiniteQueryResult.data.map((product) => (
              <li key={product.objectID} className="product">
                <span className="product-name">{product.name}</span>
                {product.shortDescription && (
                  <>
                    <br />
                    <span className="product-description">
                      {product.shortDescription}
                    </span>
                  </>
                )}
                <br />
                <span className="product-price">${product.salePrice}</span>
              </li>
            ))
          ) : (
            <h3>No products found!</h3>
          )}
        </div>
        {infiniteQueryResult.hasNextPage && (
          <button
            type="button"
            className="search-more"
            onClick={() => infiniteQueryResult.fetchNextPage()}
            disabled={isFetching(infiniteQueryResult)}
          >
            more
          </button>
        )}
        {isFetchingNextPage(infiniteQueryResult) && (
          <div className="search-status">Fetching next page...</div>
        )}
      </div>
    </div>
  )
}
