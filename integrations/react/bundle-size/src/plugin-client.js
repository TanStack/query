import { QueryClient, infiniteQueryPlugin, mutationPlugin } from '#adapter'

export const client = new QueryClient({
  plugins: [mutationPlugin, infiniteQueryPlugin],
})
