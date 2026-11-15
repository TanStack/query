import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './post-list'
import './post-detail'
import type { QueryKey } from '@tanstack/lit-query'

// Define a default query function that will receive the query key
const defaultQueryFn = async ({ queryKey }: { queryKey: QueryKey }) => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  if (!response.ok) throw new Error('Failed to fetch data')
  return await response.json()
}

// provide the default query function to your app with defaultOptions
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
})

class DefaultQueryFunctionQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class DefaultQueryFunctionApp extends LitElement {
  static properties = {
    postId: { state: true },
  }

  private postId = -1

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setPostId(event: CustomEvent<number>) {
    this.postId = event.detail
  }

  render() {
    return html`
      <default-query-function-query-provider>
        <p>
          As you visit the posts below, you will notice them in a loading state
          the first time you load them. However, after you return to this list
          and click on any posts you have already visited again, you will see
          them load instantly and background refresh right before your eyes!
          <strong>
            (You may need to throttle your network speed to simulate longer
            loading sequences)
          </strong>
        </p>
        ${
          this.postId > -1
            ? html`<post-detail
                .postId=${this.postId}
                @set-post-id=${this.setPostId}
              ></post-detail>`
            : html`<post-list @set-post-id=${this.setPostId}></post-list>`
        }
      </default-query-function-query-provider>
    `
  }
}

customElements.define(
  'default-query-function-query-provider',
  DefaultQueryFunctionQueryProvider,
)
customElements.define('default-query-function-app', DefaultQueryFunctionApp)
