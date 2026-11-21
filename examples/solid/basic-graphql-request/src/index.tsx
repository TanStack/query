/* @refresh reload */
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { For, Match, Show, Switch, createSignal } from 'solid-js'
import { render } from 'solid-js/web'
import { postsQueries } from './services/posts/queries'
import type { Setter } from 'solid-js'

const queryClient = new QueryClient()

function App() {
  const [postId, setPostId] = createSignal<string | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
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
      <Show when={postId()} fallback={<Posts setPostId={setPostId} />}>
        {(id) => <Post postId={id()} setPostId={setPostId} />}
      </Show>
    </QueryClientProvider>
  )
}

function Posts(props: { setPostId: Setter<string | null> }) {
  const state = useQuery(() => postsQueries.list())

  return (
    <div>
      <h1>Posts</h1>
      <div>
        <Switch>
          <Match when={state.status === 'pending'}>Loading...</Match>
          <Match when={state.status === 'error'}>
            <span>Error: {(state.error as Error).message}</span>
          </Match>
          <Match when={state.data !== undefined}>
            <>
              <div>
                <For each={state.data}>
                  {(post) => (
                    <p>
                      <a
                        onClick={() => props.setPostId(post.id)}
                        href="#"
                        style={
                          // We can find the existing query data here to show bold links for
                          // ones that are cached
                          queryClient.getQueryData(
                            postsQueries.detail(post.id).queryKey,
                          )
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

function Post(props: { postId: string; setPostId: Setter<string | null> }) {
  const state = useQuery(() => postsQueries.detail(props.postId))

  return (
    <div>
      <div>
        <a onClick={() => props.setPostId(null)} href="#">
          Back
        </a>
      </div>
      <Switch>
        <Match when={state.status === 'pending'}>Loading...</Match>
        <Match when={state.status === 'error'}>
          <span>Error: {(state.error as Error).message}</span>
        </Match>
        <Match when={state.data !== undefined}>
          <>
            <h1>{state.data?.title}</h1>
            <div>
              <p>{state.data?.body}</p>
            </div>
            <div>{state.isFetching ? 'Background Updating...' : ' '}</div>
          </>
        </Match>
      </Switch>
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

render(() => <App />, root)
