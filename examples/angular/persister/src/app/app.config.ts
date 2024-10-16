import { provideHttpClient, withFetch } from '@angular/common/http'
import { QueryClient } from '@tanstack/angular-query-experimental'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { providePersistAngularQuery } from '@tanstack/angular-query-persist-client-experimental'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import type { Route } from '@angular/router'
import type { ApplicationConfig } from '@angular/core'

export const routes: Array<Route> = [
  {
    path: '',
    loadComponent: () => import('./posts/posts.component'),
  },
  {
    path: 'posts/:postId',
    loadComponent: () => import('./posts/post.component'),
  },
]

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    providePersistAngularQuery(queryClient, [{ persister }]),
    provideRouter(routes, withComponentInputBinding()),
  ],
}
