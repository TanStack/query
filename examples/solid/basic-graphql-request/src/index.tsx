/* @refresh reload */
import {
  createQuery,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/solid-query'
import type { Accessor, Setter } from 'solid-js'
import { createSignal, For, Match, Switch } from 'solid-js'
import { render } from 'solid-js/web'
import { request, gql } from 'graphql-request'

const endpoint = 'https://graphqlzero.almansi.me/api'

const queryClient = new QueryClient()

function App() {
  const [postId, setPostId] = createSignal(-1)

  return (
    <QueryClientProvider client={queryClient}>
      <p>
        As you visit the posts below, you will notice them in a loading state
        the first time you load them. However, after you return to this list and
        click on any posts you have already visited again, you will see them
        load instantly and background refresh right before your eyes!{' '}
        <strong>
          (You may need to throttle your network speed to simulate longer
          loading sequences)
        </strong>
      </p>
      {postId() > -1 ? (
        <Post postId={postId()} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
    </QueryClientProvider>
  )
}

function createPosts() {
  return createQuery({
    queryKey: () => ['posts'],
    queryFn: async () => {
      const {
        posts: { data },
      } = await request(
        endpoint,
        gql`
          query {
            posts {
              data {
                id
                title
              }
            }
          }
        `,
      )
      return data
    },
  })
}

function Posts(props: { setPostId: Setter<number> }) {
  const queryClient = useQueryClient()
  const state = createPosts()

  return (
    <div>
      <h1>Posts</h1>
      <div>
        <Switch>
          <Match when={state.status === 'loading'}>Loading...</Match>
          <Match when={state.status === 'error'}>
            <span>Error: {(state.error as Error).message}</span>
          </Match>
          <Match when={state.data !== undefined}>
            <>
              <div>
                <For each={state.data}>
                  {(post: any) => (
                    <p>
                      <a
                        onClick={() => props.setPostId(post.id)}
                        href="#"
                        style={
                          // We can find the existing query data here to show bold links for
                          // ones that are cached
                          queryClient.getQueryData(['post', post.id])
                            ? {
                                'font-weight': 'bold',
                                color: 'green',
                              }
                            : {}
                        }
                      >
                        {post.title}
                      </a>
                    </p>
                  )}
                </For>
              </div>
              <div>{state.isFetching ? 'Background Updating...' : ' '}</div>
            </>
          </Match>
        </Switch>
      </div>
    </div>
  )
}

function createPost(postId: Accessor<number>) {
  return createQuery({
    queryKey: () => ['post', postId()],
    queryFn: async (context) => {
      const { post } = await request(
        endpoint,
        gql`
        query {
          post(id: ${context.queryKey[1]}) {
            id
            title
            body
          }
        }
        `,
      )

      return post
    },
    enabled: !!postId,
  })
}

function Post(props: { postId: number; setPostId: Setter<number> }) {
  const state = createPost(() => props.postId)

  return (
    <div>
      <div>
        <a onClick={() => props.setPostId(-1)} href="#">
          Back
        </a>
      </div>
      <Switch>
        <Match when={!props.postId || state.status === 'loading'}>
          Loading...
        </Match>
        <Match when={state.status === 'error'}>
          <span>Error: {(state.error as Error).message}</span>
        </Match>
        <Match when={state.data !== undefined}>
          <>
            <h1>{state.data.title}</h1>
            <div>
              <p>{state.data.body}</p>
            </div>
            <div>{state.isFetching ? 'Background Updating...' : ' '}</div>
          </>
        </Match>
      </Switch>
    </div>
  )
}

render(() => <App />, document.getElementById('root') as HTMLElement)
