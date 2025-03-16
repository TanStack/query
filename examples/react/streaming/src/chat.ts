import {
  queryOptions,
  experimental_streamedQuery as streamedQuery,
} from '@tanstack/react-query'

const answers = [
  "I'm just an example chat, I can't really answer any questions :(".split(' '),
  'TanStack is great. Would you like to know more?'.split(' '),
]

function chatAnswer(_question: string) {
  return {
    async *[Symbol.asyncIterator]() {
      const answer = answers[Math.floor(Math.random() * answers.length)]
      let index = 0
      while (index < answer.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 500),
        )
        yield answer[index++]
      }
    },
  }
}

export const chatQueryOptions = (question: string) =>
  queryOptions({
    queryKey: ['chat', question],
    queryFn: streamedQuery({
      queryFn: () => chatAnswer(question),
    }),
    staleTime: Infinity,
  })
