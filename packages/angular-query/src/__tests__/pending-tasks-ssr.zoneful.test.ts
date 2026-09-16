import {
  ChangeDetectionStrategy,
  Component,
  destroyPlatform,
  provideZoneChangeDetection,
  signal,
} from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server'
import { afterEach, describe, expect, it } from 'vitest'
import {
  QueryClient,
  injectQueries,
  injectQuery,
  provideTanStackQuery,
} from '..'
import type { ApplicationRef, Type } from '@angular/core'

const fetchData = () =>
  new Promise<string>((resolve) => {
    setTimeout(() => resolve('fetched-on-server'), 20)
  })

@Component({
  selector: 'app-root',
  template: '{{ query.data() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CachedQueryComponent {
  readonly query = injectQuery(() => ({
    queryKey: ['cached'],
    initialData: 'cached-on-server',
    queryFn: fetchData,
    staleTime: 30_000,
    gcTime: 24 * 60 * 60 * 1000,
  }))
}

@Component({
  selector: 'app-root',
  template: '{{ query.data() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FetchingQueryComponent {
  readonly query = injectQuery(() => ({
    queryKey: ['fetching'],
    queryFn: fetchData,
    staleTime: 30_000,
    gcTime: 24 * 60 * 60 * 1000,
  }))
}

@Component({
  selector: 'app-root',
  template: '{{ queries()[0].data() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FetchingQueriesComponent {
  readonly queries = injectQueries(() => ({
    queries: [
      {
        queryKey: ['parallel'],
        queryFn: fetchData,
        staleTime: 30_000,
        gcTime: 24 * 60 * 60 * 1000,
      },
    ],
  }))
}

@Component({
  selector: 'app-root',
  template: '{{ query.data() }}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveQueryComponent {
  readonly key = signal('first')
  readonly query = injectQuery(() => ({
    queryKey: [this.key()],
    initialData: this.key(),
    queryFn: fetchData,
    staleTime: 30_000,
    gcTime: 24 * 60 * 60 * 1000,
  }))

  ngOnInit() {
    setTimeout(() => this.key.set('second'), 20)
  }
}

async function render(component: Type<unknown>) {
  const client = new QueryClient()
  let app: ApplicationRef | undefined
  let deadline: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      renderApplication(
        async (context) => {
          app = await bootstrapApplication(
            component,
            {
              providers: [
                provideServerRendering(),
                provideZoneChangeDetection(),
                provideTanStackQuery(() => client),
              ],
            },
            context,
          )
          return app
        },
        {
          url: '/',
          document: '<html><body><app-root></app-root></body></html>',
        },
      ),
      new Promise<never>((_, reject) => {
        deadline = setTimeout(
          () =>
            reject(new Error('SSR did not become stable within one second')),
          1000,
        )
      }),
    ])
  } finally {
    clearTimeout(deadline)
    if (app && !app.destroyed) app.destroy()
    client.clear()
  }
}

describe('SSR with real Zone.js timers', () => {
  afterEach(() => destroyPlatform())

  it('serializes cached data without waiting for stale or GC timers', async () => {
    expect(await render(CachedQueryComponent)).toContain('cached-on-server')
  })

  it('serializes reactive query changes without waiting for background timers', async () => {
    expect(await render(ReactiveQueryComponent)).toContain('second')
  })

  it('waits for a query fetch, but not its background timers', async () => {
    expect(await render(FetchingQueryComponent)).toContain('fetched-on-server')
  })

  it('waits for parallel query fetches, but not their background timers', async () => {
    expect(await render(FetchingQueriesComponent)).toContain(
      'fetched-on-server',
    )
  })
})
