import {
  ChangeDetectionStrategy,
  Component,
  destroyPlatform,
  provideZonelessChangeDetection,
} from '@angular/core'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server'
import { bootstrapApplication } from '@angular/platform-browser'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient } from '@tanstack/query-core'
import { injectQueries } from '../inject-queries'
import { injectQuery } from '../inject-query'
import { provideTanStackQuery } from '../providers'

describe('PendingTasks SSR', () => {
  beforeEach(() => {
    destroyPlatform()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  @Component({
    selector: 'app-root',
    template: '{{ query.data() }}',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TestInjectQueryComponent {
    query = injectQuery(() => ({
      queryKey: ['ssr-test'],
      queryFn: async () => {
        await sleep(1000)
        return 'data-fetched-on-ssr'
      },
    }))
  }

  @Component({
    selector: 'app-queries-root',
    template: '{{ queries()[0].data() }}',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  class TestInjectQueriesComponent {
    queries = injectQueries(() => ({
      queries: [
        {
          queryKey: ['ssr-queries-test'],
          queryFn: async () => {
            await sleep(1000)
            return 'queries-data-fetched-on-ssr'
          },
        },
      ],
    }))
  }

  test('should wait for stability of injectQuery', async () => {
    const htmlPromise = renderApplication(
      (context) =>
        bootstrapApplication(TestInjectQueryComponent, {
          providers: [
            provideServerRendering(),
            provideZonelessChangeDetection(),
            // Query client is created per request here
            provideTanStackQuery(
              new QueryClient({
                defaultOptions: { queries: { retry: false } },
              }),
            ),
          ],
        }, context),
      {
        url: '/',
        document:
          '<!doctype html><html><body><app-root></app-root></body></html>',
      },
    )

    await vi.runAllTimersAsync()
    const html = await htmlPromise

    expect(html).toContain('data-fetched-on-ssr')
  })

  test('should wait for stability of injectQueries', async () => {
    const htmlPromise = renderApplication(
      (context) =>
        bootstrapApplication(TestInjectQueriesComponent, {
          providers: [
            provideServerRendering(),
            provideZonelessChangeDetection(),
            // Query client is created per request here
            provideTanStackQuery(
              new QueryClient({
                defaultOptions: { queries: { retry: false } },
              }),
            ),
          ],
        }, context),
      {
        url: '/',
        document:
          '<!doctype html><html><body><app-queries-root></app-queries-root></body></html>',
      },
    )

    await vi.runAllTimersAsync()
    const html = await htmlPromise

    expect(html).toContain('queries-data-fetched-on-ssr')
  })
})
