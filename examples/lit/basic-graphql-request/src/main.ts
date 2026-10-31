import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'
import './post-list'
import './post-detail'

const queryClient = new QueryClient()

class BasicGraphqlRequestQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

class BasicGraphqlRequestApp extends LitElement {
  static properties = {
    postId: { state: true },
  }

  private postId: string | null = null

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  private setPostId(event: CustomEvent<string | null>) {
    this.postId = event.detail
  }

  render() {
    return html`
      <basic-graphql-request-query-provider>
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
          this.postId !== null
            ? html`<post-detail
                .postId=${this.postId}
                @set-post-id=${this.setPostId}
              ></post-detail>`
            : html`<post-list @set-post-id=${this.setPostId}></post-list>`
        }
      </basic-graphql-request-query-provider>
    `
  }
}

customElements.define(
  'basic-graphql-request-query-provider',
  BasicGraphqlRequestQueryProvider,
)
customElements.define('basic-graphql-request-app', BasicGraphqlRequestApp)
