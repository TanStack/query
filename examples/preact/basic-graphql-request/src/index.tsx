import { render } from 'preact'
import { useState } from 'preact/hooks'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { postsQueries } from './services/posts/queries'

const queryClient = new QueryClient()

function App() {
  const [postId, setPostId] = useState<string | null>(null)

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
      {postId !== null ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
      <PreactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

function Posts({ setPostId }: { setPostId: (postId: string | null) => void }) {
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
                      // We can find the existing query data here to show bold links for
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
  postId: string
  setPostId: (postId: string | null) => void
}) {
  const { status, data, error, isFetching } = useQuery(
    postsQueries.detail(postId),
  )

  return (
    <div>
      <div>
        <a onClick={() => setPostId(null)} href="#">
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

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
