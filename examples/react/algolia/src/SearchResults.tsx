import {
  isFetching,
  isFetchingNextPage,
  isLoading,
  useQuery,
} from '@tanstack/react-query'
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
  const queryResult = useQuery(
    productsQueries.search<Product>({
      indexName: 'bestbuy',
      query,
      hitsPerPage: 5,
    }),
  )
  const { data: hits, error, status, hasNextPage, fetchNextPage } = queryResult
  const loading = isLoading(queryResult)
  const fetching = isFetching(queryResult)
  const fetchingNextPage = isFetchingNextPage(queryResult)

  if (!query) return null

  if (loading) return <div className="loading">Loading...</div>

  if (status === 'error') return <div>Error: {error.message}</div>

  return (
    <div>
      <div className="search-status">
        Status: {status} {fetching && <span>fetching...</span>}
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
            disabled={fetching}
          >
            more
          </button>
        )}
        {fetchingNextPage && (
          <div className="search-status">Fetching next page...</div>
        )}
      </div>
    </div>
  )
}
