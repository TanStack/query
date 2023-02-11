/* @refresh reload */
import type { QueryFunction } from '@tanstack/solid-query'
import {
  createQuery,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/solid-query'
import type { Setter } from 'solid-js'
import { createSignal, For, Match, Show, Switch } from 'solid-js'
import { render } from 'solid-js/web'

// Define a default query function that will receive the query key
const defaultQueryFn: QueryFunction<unknown> = async ({ queryKey }) => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
    {
      method: 'GET',
    },
  )
  return response.json()
}

// provide the default query function to your app via the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
})

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
      <Show when={postId() > -1} fallback={<Posts setPostId={setPostId} />}>
        <Post postId={postId()} setPostId={setPostId} />
      </Show>
    </QueryClientProvider>
  )
}

function Posts(props: { setPostId: Setter<number> }) {
  const queryClient = useQueryClient()

  // All you have to do now is pass a key!
  const state = createQuery<any[]>({ queryKey: () => ['/posts'] })

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
                  {(post) => (
                    <p>
                      <a
                        onClick={() => props.setPostId(post.id)}
                        href="#"
                        style={
                          // We can use the queryCache here to show bold links for
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

function Post(props: { postId: number; setPostId: Setter<number> }) {
  // You can even leave out the queryFn and just go straight into options
  const state = createQuery<any>({
    queryKey: () => [`/posts/${props.postId}`],
    enabled: !!props.postId,
  })

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
