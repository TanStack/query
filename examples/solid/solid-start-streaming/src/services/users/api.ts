const doSleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const usersAPI = {
  getUser: async ({
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
  },
}
