import {
  createInfiniteQueryController,
  isFetching,
  isFetchingNextPage,
  isLoading,
  select,
} from '@tanstack/lit-query'
import { LitElement, html } from 'lit'
import { productsQueries } from './services/products/queries'

type Product = {
  name: string
  shortDescription: string
  salePrice: number
}

class SearchResults extends LitElement {
  static properties = {
    query: { attribute: false },
  }

  query = ''

  private readonly products = createInfiniteQueryController(this, () => ({
    ...productsQueries.search<Product>({
      indexName: 'bestbuy',
      query: this.query,
      hitsPerPage: 5,
    }),
    select: [select, (data) => data.pages.flatMap((page) => page.hits)],
    staleTime: 30 * 1000, // 30s
    gcTime: 15 * 60 * 1000, // 15m
  }))

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    if (!this.query) return null

    const queryResult = this.products()

    if (isLoading(queryResult))
      return html`<div class="loading">Loading...</div>`

    if (queryResult.status === 'error')
      return html`<div>Error: ${queryResult.error.message}</div>`

    return html`
      <div>
        <div class="search-status">
          Status: ${queryResult.status}
          ${isFetching(queryResult) ? html`<span>fetching...</span>` : null}
        </div>
        <div>
          <div class="search-result">
            ${
              queryResult.data && queryResult.data.length > 0
                ? queryResult.data.map(
                    (product) => html`
                      <li class="product">
                        <span class="product-name">${product.name}</span>
                        ${
                          product.shortDescription
                            ? html`
                                <br />
                                <span class="product-description">
                                  ${product.shortDescription}
                                </span>
                              `
                            : null
                        }
                        <br />
                        <span class="product-price">$${product.salePrice}</span>
                      </li>
                    `,
                  )
                : html`<h3>No products found!</h3>`
            }
          </div>
          ${
            queryResult.hasNextPage
              ? html`
                  <button
                    type="button"
                    class="search-more"
                    ?disabled=${isFetching(queryResult)}
                    @click=${() => this.products.fetchNextPage()}
                  >
                    more
                  </button>
                `
              : null
          }
          ${
            isFetchingNextPage(queryResult)
              ? html`<div class="search-status">Fetching next page...</div>`
              : null
          }
        </div>
      </div>
    `
  }
}

customElements.define('search-results', SearchResults)
