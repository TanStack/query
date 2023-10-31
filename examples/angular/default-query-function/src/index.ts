import '@angular/compiler'
import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideAngularQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'
import axios from 'axios'
import { DefaultQueryFunctionExampleComponent } from './default-query-function-example.component'
import type { QueryFunction } from '@tanstack/angular-query-experimental'

// Define a default query function that will receive the query key
const defaultQueryFn: QueryFunction<unknown> = async ({ queryKey }) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  return data
}

bootstrapApplication(DefaultQueryFunctionExampleComponent, {
  providers: [
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            queryFn: defaultQueryFn,
          },
        },
      }),
    ),
  ],
})
