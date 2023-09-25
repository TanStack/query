interface PostData {
  userId: number
  id: number
  title: string
  body: string
}

const doSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fetchPost = async ({
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
    ).then((res) => res.json())
  }

  // simulate extra latency to make things like streaming behavior more clear
  if (sleep) {
    await doSleep(sleep)
  }

  console.info('[api] fetchPost.done', { postId, sleep, simulateError })

  if (simulateError) {
    throw new Error('API request to get post was not OK')
  }

  return [response] as PostData[]
}

export const fetchUser = async ({
  sleep,
  simulateError,
}: { sleep?: number; simulateError?: boolean } = {}) => {
  console.info('[api] fetchUser.start', { sleep, simulateError })

  if (sleep) {
    await doSleep(sleep)
  }

  console.info('[api] fetchUser.done', { sleep, simulateError })

  if (simulateError) {
    throw new Error('API request to get user was not OK')
  }

  return {
    id: 'abc',
    name: `john doe`,
    queryTime: Date.now(),
  }
}
