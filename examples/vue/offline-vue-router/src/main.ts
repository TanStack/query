import 'vue-sonner/style.css'
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { persistQueryClient } from '@tanstack/query-persist-client-core'

import App from './App.vue'
import { worker } from './mocks'
import { persister, queryClient } from './queryClient'
import { router } from './router'

worker.start().then(() => {
  createApp(App)
    .use(VueQueryPlugin, {
      queryClient,
      clientPersister: (client) =>
        persistQueryClient({ queryClient: client, persister }),
      clientPersisterOnSuccess: (client) => {
        // resume mutations after initial restore from localStorage was successful
        client.resumePausedMutations().then(() => {
          client.invalidateQueries()
        })
      },
    })
    .use(router)
    .mount('#app')
})
