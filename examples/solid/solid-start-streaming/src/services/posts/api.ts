import type { PostData } from './types'

const doSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const postsAPI = {
  getPost: async ({
    postId,
    simulateError,
    sleep,
  }: {
    postId: number
    simulateError?: boolean
    sleep?: number
  }) => {
    console.info('[api] fetchPost.start', { postId, sleep, simulateError })

    let response
    if (!simulateError) {
      response = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${postId}`,
      ).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch post')
        return res.json()
      })
    }

    // simulate extra latency to make things like streaming behavior more clear
    if (sleep) {
      await doSleep(sleep)
    }

    console.info('[api] fetchPost.done', { postId, sleep, simulateError })

    if (simulateError) {
      throw new Error('API request to get post was not OK')
    }

    return [response] as Array<PostData>
  },
}
