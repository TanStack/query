import {
  QueryClient,
  QueryClientProvider,
  defaultQueryFn,
  getQueryData,
  isFetching,
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { render } from 'preact'
import { useState } from 'preact/hooks'
import type { QueryKey } from '@tanstack/preact-query'

type Post = {
  id: number
  title: string
  body: string
}

// Define a default query function that will receive the query key
const fetchByQueryKey = async ({ queryKey }: { queryKey: QueryKey }) => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  if (!response.ok) throw new Error('Failed to fetch data')
  return await response.json()
}

// provide the default query function to your app via the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: fetchByQueryKey,
    },
  },
})

function App() {
  const [postId, setPostId] = useState(-1)

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
      {postId > -1 ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
      <PreactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}

function Posts({ setPostId }: { setPostId: (postId: number) => void }) {
  const queryClient = useQueryClient()

  const queryResult = useQuery(
    queryOptions<Array<Post>>({
      queryKey: ['/posts'],
      queryFn: defaultQueryFn,
    }),
  )

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
                      // We can use the queryCache here to show bold links for
                      // ones that are cached
                      getQueryData(queryClient, [`/posts/${post.id}`])
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
  postId: number
  setPostId: (postId: number) => void
}) {
  const detailQuery = useQuery(
    queryOptions<Post>({
      queryKey: [`/posts/${postId}`],
      queryFn: defaultQueryFn,
      enabled: !!postId,
    }),
  )

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {!postId || detailQuery.status === 'pending' ? (
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
