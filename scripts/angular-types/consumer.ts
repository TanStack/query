import { Component } from '@angular/core'
import {
  QueryClient,
  injectMutation,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideTanStackQuery(
      () => new QueryClient(),
      withDevtools(() => ({ loadDevtools: false })),
      withPersistQueryClient(() => ({
        persistOptions: {
          persister: {
            persistClient: () => {},
            restoreClient: () => undefined,
            removeClient: () => {},
          },
        },
      })),
    ),
  ],
}

@Component({
  standalone: true,
  template: `
    @if (query.isSuccess()) {
      <span>{{ query.data().title }}</span>
    }
    <button (click)="mutation.mutate('updated')">
      {{ mutation.isPending() ? 'Saving' : 'Save' }}
    </button>
  `,
})
export class AngularCompatibilityComponent {
  readonly query = injectQuery(() => ({
    queryKey: ['angular-compatibility'],
    queryFn: () => Promise.resolve({ title: 'Angular Query' }),
  }))

  readonly mutation = injectMutation(() => ({
    mutationFn: (title: string) => Promise.resolve({ title }),
  }))
}
