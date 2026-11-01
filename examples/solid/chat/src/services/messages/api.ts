const answers = [
  "I'm just an example chat, I can't really answer any questions :(".split(' '),
  'TanStack is great. Would you like to know more?'.split(' '),
]

export const messagesAPI = {
  getAnswer: (_question: string, signal: AbortSignal) => {
    return {
      async *[Symbol.asyncIterator]() {
        const answer = answers[Math.floor(Math.random() * answers.length)]
        let index = 0
        while (index < answer.length) {
          await new Promise<void>((resolve) => {
            const onAbort = () => {
              clearTimeout(timeout)
              resolve()
            }
            const timeout = setTimeout(
              () => {
                signal.removeEventListener('abort', onAbort)
                resolve()
              },
              100 + Math.random() * 300,
            )
            signal.addEventListener('abort', onAbort, { once: true })
          })
          if (signal.aborted) return
          yield answer[index++]
        }
      },
    }
  },
}
