import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import type { QueryKey } from '@tanstack/vue-query'

// Define a default query function that will receive the query key
const defaultQueryFn = async ({ queryKey }: { queryKey: QueryKey }) => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  if (!response.ok) throw new Error('Failed to fetch data')
  return await response.json()
}

createApp(App)
  // provide the default query function to your app via the query client
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          queryFn: defaultQueryFn,
        },
      },
    },
  })
  .mount('#app')
