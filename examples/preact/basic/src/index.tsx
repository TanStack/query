import { render } from 'preact'
import { useState } from 'preact/hooks'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/preact-query'
import { PersistQueryClientProvider } from '@tanstack/preact-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { postsQueries } from './services/posts/queries'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

function Posts({ setPostId }: { setPostId: (postId: number) => void }) {
  const queryClient = useQueryClient()
  const { status, data, error, isFetching } = useQuery(postsQueries.list())

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {status === 'pending' ? (
          'Loading...'
        ) : status === 'error' ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map((post) => (
                <p key={post.id}>
                  <a
                    onClick={() => setPostId(post.id)}
                    href="#"
                    style={
                      // We can access the query data here to show bold links for
                      // ones that are cached
                      queryClient.getQueryData(
                        postsQueries.detail(post.id).queryKey,
                      )
                        ? {
                            fontWeight: 'bold',
                            color: 'green',
                          }
                        : {}
                    }
                  >
                    {post.title}
                  </a>
                </p>
              ))}
            </div>
            <div>{isFetching ? 'Background Updating...' : ' '}</div>
          </>
        )}
      </div>
    </div>
  )
}

function Post({
  postId,
  setPostId,
}: {
  postId: number
  setPostId: (postId: number) => void
}) {
  const { status, data, error, isFetching } = useQuery(
    postsQueries.detail(postId),
  )

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {status === 'pending' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.title}</h1>
          <div>
            <p>{data.body}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  )
}

function App() {
  const [postId, setPostId] = useState(-1)

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
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
      {postId > -1 ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
      <PreactQueryDevtools initialIsOpen />
    </PersistQueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
