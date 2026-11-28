import { persistQueryClient } from '@tanstack/query-persist-client-core'
import 'vue-sonner/style.css'
import {
  VueQueryPlugin,
  invalidateQueries,
  resumePausedMutations,
} from '@tanstack/vue-query'
import { createApp } from 'vue'
import App from './App.vue'
import { worker } from './mocks'
import { persister, queryClient } from './queryClient'

worker.start().then(() => {
  createApp(App)
    .use(VueQueryPlugin, {
      queryClient,
      clientPersister: (client) =>
        persistQueryClient({ queryClient: client, persister }),
      clientPersisterOnSuccess: (client) => {
        // resume mutations after initial restore from localStorage was successful
        resumePausedMutations(client).then(() => {
          invalidateQueries(client)
        })
      },
    })
    .mount('#app')
})
