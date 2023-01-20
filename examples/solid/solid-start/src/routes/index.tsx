import { Title } from 'solid-start'
import { createQuery, useQueryClient } from '@tanstack/solid-query'
import { createSignal, For, Suspense } from 'solid-js'
import { isServer } from 'solid-js/web'

interface PostData {
  userId: number
  id: number
  title: string
  body: string
}

export default function Home() {
  const [postId, setPostId] = createSignal(1)

  const query = createQuery(() => ({
    queryKey: ['posts', postId()],
    queryFn: async () => {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts/' + postId(),
      ).then((res) => res.json())
      return [response] as PostData[]
    },
  }))

  return (
    <main>
      <Title>Solid Query v5</Title>
      <h1>Solid Query v5</h1>
      <p>
        This is just a dev release for demo. Please dont use it in production
        yet. Also this package will be deprecated as soon as features are live
        on @tanstack/query
      </p>
      <div>
        <button
          onClick={() => {
            setPostId((id) => (id === 1 ? 1 : id - 1))
          }}
        >
          Previous Page
        </button>
        <button
          onClick={() => {
            setPostId((id) => (id === 100 ? 100 : id + 1))
          }}
        >
          Next Page
        </button>
      </div>
      <Suspense>
        <For each={query.data}>
          {(post) => (
            <div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </div>
          )}
        </For>
      </Suspense>
    </main>
  )
}
