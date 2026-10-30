import { queryOptions } from '@tanstack/react-query'

// ✅ passes: queryKey and queryFn are co-located via queryOptions()
export const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: () => fetchTodos(),
})

// ✅ passes: factory function wrapping queryOptions()
export const todoOptions = (id: string) =>
  queryOptions({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
  })

function fetchTodos(): Promise<Array<{ id: string; title: string }>> {
  throw new Error('not implemented')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchTodo(id: string): Promise<{ id: string; title: string }> {
  throw new Error('not implemented')
}

// Used by require-prefetch-demo.tsx
export const postOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
  })

export const postsOptions = (page: number) =>
  queryOptions({
    queryKey: ['posts', { page }],
    queryFn: () => fetchPosts(page),
  })

export const commentsOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId, 'comments'],
    queryFn: () => fetchComments(postId),
  })

export const authorOptions = (authorId: string) =>
  queryOptions({
    queryKey: ['authors', authorId],
    queryFn: () => fetchAuthor(authorId),
  })

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchAuthor(authorId: string): Promise<{ name: string }> {
  throw new Error('not implemented')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchPost(postId: string): Promise<{ id: string; title: string }> {
  throw new Error('not implemented')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchPosts(page: number): Promise<Array<{ id: string }>> {
  throw new Error('not implemented')
}

function fetchComments(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postId: string,
): Promise<Array<{ id: string; body: string }>> {
  throw new Error('not implemented')
}
