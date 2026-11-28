import {
  QueryClient,
  QueryClientProvider,
  getQueryData,
  isFetching,
  useQuery,
  useQueryClient,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { render } from 'preact'
import { useState } from 'preact/hooks'
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
  const queryResult = useQuery(postsQueries.list())

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {queryResult.status === 'pending' ? (
          'Loading...'
        ) : queryResult.status === 'error' ? (
          <span>Error: {queryResult.error.message}</span>
        ) : (
          <>
            <div>
              {queryResult.data.map((post) => (
                <p key={post.id}>
                  <a
                    onClick={() => setPostId(post.id)}
                    href="#"
                    style={
                      // We can find the existing query data here to show bold links for
                      // ones that are cached
                      getQueryData(
                        queryClient,
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
            <div>
              {isFetching(queryResult) ? 'Background Updating...' : ' '}
            </div>
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
  const detailQuery = useQuery(postsQueries.detail(postId))

  return (
    <div>
      <div>
        <a onClick={() => setPostId(null)} href="#">
          Back
        </a>
      </div>
      {detailQuery.status === 'pending' ? (
        'Loading...'
      ) : detailQuery.status === 'error' ? (
        <span>Error: {detailQuery.error.message}</span>
      ) : (
        <>
          <h1>{detailQuery.data.title}</h1>
          <div>
            <p>{detailQuery.data.body}</p>
          </div>
          <div>{isFetching(detailQuery) ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')
render(<App />, rootElement)
