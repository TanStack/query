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
  class TestComponent {
    query = injectQuery(() => ({
      queryKey: ['ssr-test'],
      queryFn: async () => {
        await sleep(1000)
        return 'data-fetched-on-ssr'
      },
    }))
  }

  test('should wait for stability of queries', async () => {
    const htmlPromise = renderApplication(
      () =>
        bootstrapApplication(TestComponent, {
          providers: [
            provideServerRendering(),
            provideZonelessChangeDetection(),
            provideTanStackQuery(
              new QueryClient({
                defaultOptions: { queries: { retry: false } },
              }),
            ),
          ],
        }),
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
})
