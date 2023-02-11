/* @refresh reload */
import {
  createQuery,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/solid-query'
import type { Component, Setter } from 'solid-js'
import { createSignal, For, Match, Switch } from 'solid-js'
import { render } from 'solid-js/web'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

type Post = {
  id: number
  title: string
  body: string
}

function createPosts() {
  return createQuery({
    queryKey: () => ['posts'],
    queryFn: async (): Promise<Array<Post>> => {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts',
        {
          method: 'GET',
        },
      )
      return response.json()
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
          <Match when={state.error instanceof Error}>
            <span>Error: {(state.error as Error).message}</span>
          </Match>
          <Match when={state.data !== undefined}>
            <>
              <div>
                <For each={state.data!}>
                  {(post) => (
                    <p>
                      <a
                        onClick={() => props.setPostId(post.id)}
                        href="#"
                        style={
                          // We can access the query data here to show bold links for
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

const getPostById = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    {
      method: 'GET',
    },
  )
  return await response.json()
}

function createPost(postId: number) {
  return createQuery(
    () => ['post', postId],
    () => getPostById(postId),
    {
      enabled: !!postId,
    },
  )
}

function Post(props: { postId: number; setPostId: Setter<number> }) {
  const state = createPost(props.postId)

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
        <Match when={state.error instanceof Error}>
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

const App: Component = () => {
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

render(() => <App />, document.getElementById('root') as HTMLElement)
