// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { QueryCache, QueryClient, noop } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { LitElement, html } from 'lit'
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'
import { createQueryController } from '../createQueryController.js'
import { useIsFetching } from '../useIsFetching.js'
import { useMutationState } from '../useMutationState.js'
import { generateElementName } from './utils.js'

async function renderToString(
  elementClass: CustomElementConstructor,
): Promise<string> {
  const tagName = generateElementName()
  customElements.define(tagName, elementClass)
  const tag = unsafeStatic(tagName)
  const markup = await collectResult(render(staticHtml`<${tag}></${tag}>`))
  return markup.replace(/<!--[^]*?-->|<\?>/g, '')
}

describe('Server Side Rendering', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should not trigger fetch', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    class Page extends LitElement {
      readonly query = createQueryController(
        this,
        { queryKey: key, queryFn },
        queryClient,
      )

      override render() {
        return html`<div>status ${this.query().status}</div>`
      }
    }

    const markup = await renderToString(Page)

    expect(markup).toContain('status pending')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  it('should return existing data from the cache', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    class Page extends LitElement {
      readonly query = createQueryController(
        this,
        { queryKey: key, queryFn },
        queryClient,
      )

      override render() {
        return html`<div>status ${this.query().status}</div>`
      }
    }

    queryClient.query({ queryKey: key, queryFn }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = await renderToString(Page)

    expect(markup).toContain('status success')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should add initialData to the cache', async () => {
    const key = queryKey()

    class Page extends LitElement {
      readonly page = 1

      readonly query = createQueryController(
        this,
        {
          queryKey: [key, this.page],
          queryFn: () => sleep(10).then(() => this.page),
          initialData: 1,
        },
        queryClient,
      )

      override render() {
        return html`<h1>${this.query().data}</h1>`
      }
    }

    await renderToString(Page)

    const keys = queryCache.getAll().map((query) => query.queryKey)

    expect(keys).toEqual([[key, 1]])
  })

  it('createInfiniteQueryController should return the correct state', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'page 1'))

    class Page extends LitElement {
      readonly query = createInfiniteQueryController(
        this,
        {
          queryKey: key,
          queryFn,
          getNextPageParam: () => undefined,
          initialPageParam: 0,
        },
        queryClient,
      )

      override render() {
        return html`<ul>
          ${this.query().data?.pages.map((page) => html`<li>${page}</li>`)}
        </ul>`
      }
    }

    queryClient
      .infiniteQuery({
        queryKey: key,
        queryFn,
        initialPageParam: 0,
      })
      .catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = await renderToString(Page)

    expect(markup).toContain('page 1')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('useIsFetching should return 0 after prefetch completes', async () => {
    const key = queryKey()
    const queryFn = () => sleep(10).then(() => 'data')

    class Page extends LitElement {
      readonly query = createQueryController(
        this,
        { queryKey: key, queryFn },
        queryClient,
      )

      readonly isFetching = useIsFetching(this, {}, queryClient)

      override render() {
        return html`<div>${this.query().data}</div>
          <div>isFetching: ${this.isFetching()}</div>`
      }
    }

    queryClient.query({ queryKey: key, queryFn }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = await renderToString(Page)

    expect(markup).toContain('data')
    expect(markup).toContain('isFetching: 0')
  })

  it('createQueriesController should return existing data from the cache', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = () => sleep(10).then(() => 'data1')
    const queryFn2 = () => sleep(10).then(() => 'data2')

    class Page extends LitElement {
      readonly queries = createQueriesController(
        this,
        {
          queries: [
            { queryKey: key1, queryFn: queryFn1 },
            { queryKey: key2, queryFn: queryFn2 },
          ],
        },
        queryClient,
      )

      override render() {
        const [query1, query2] = this.queries()
        return html`<div>status1: ${query1.status}</div>
          <div>status2: ${query2.status}</div>
          <div>data1: ${query1.data}</div>
          <div>data2: ${query2.data}</div>`
      }
    }

    queryClient.query({ queryKey: key1, queryFn: queryFn1 }).catch(noop)
    queryClient.query({ queryKey: key2, queryFn: queryFn2 }).catch(noop)
    await vi.advanceTimersByTimeAsync(10)

    const markup = await renderToString(Page)

    expect(markup).toContain('status1: success')
    expect(markup).toContain('status2: success')
    expect(markup).toContain('data1: data1')
    expect(markup).toContain('data2: data2')
  })

  it('createMutationController should return idle status', async () => {
    class Page extends LitElement {
      readonly mutation = createMutationController(
        this,
        { mutationFn: () => sleep(10).then(() => 'data') },
        queryClient,
      )

      override render() {
        return html`<div>status: ${this.mutation().status}</div>`
      }
    }

    const markup = await renderToString(Page)

    expect(markup).toContain('status: idle')
  })

  it('useMutationState should return empty array', async () => {
    class Page extends LitElement {
      readonly mutationState = useMutationState(this, {}, queryClient)

      override render() {
        return html`<div>mutationState: ${this.mutationState().length}</div>`
      }
    }

    const markup = await renderToString(Page)

    expect(markup).toContain('mutationState: 0')
  })
})
