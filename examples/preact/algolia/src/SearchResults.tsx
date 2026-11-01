import { useInfiniteQuery } from '@tanstack/preact-query'
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
  const {
    data: hits,
    error,
    isLoading,
    isFetching,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...productsQueries.search<Product>({
      indexName: 'bestbuy',
      query,
      hitsPerPage: 5,
    }),
    select: (data) => data.pages.flatMap((page) => page.hits),
    staleTime: 30 * 1000, // 30s
    gcTime: 15 * 60 * 1000, // 15m
  })

  if (!query) return null

  if (isLoading) return <div className="loading">Loading...</div>

  if (status === 'error') return <div>Error: {error.message}</div>

  return (
    <div>
      <div className="search-status">
        Status: {status} {isFetching && <span>fetching...</span>}
      </div>
      <div>
        <div className="search-result">
          {hits && hits.length > 0 ? (
            hits.map((product) => (
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
        {hasNextPage && (
          <button
            type="button"
            className="search-more"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
          >
            more
          </button>
        )}
        {isFetchingNextPage && (
          <div className="search-status">Fetching next page...</div>
        )}
      </div>
    </div>
  )
}
