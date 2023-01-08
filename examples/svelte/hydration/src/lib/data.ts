export type Post = { id: number; title: string; body: string }

export const limit = 10

export const getPosts = async (limit: number) => {
  const parsed = await fetch('https://jsonplaceholder.typicode.com/posts').then(
    (r) => r.json(),
  )
  const result = parsed.filter((x: Post) => x.id <= limit)
  return result
}

export const getPostById = async (id: number) =>
  await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then((r) =>
    r.json(),
  )
