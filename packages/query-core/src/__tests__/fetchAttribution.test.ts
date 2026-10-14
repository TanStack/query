/* oxlint-disable tanstack-query/no-restricted-syntax -- fetchQuery remains a public path that must preserve attribution. */
import assert from 'node:assert/strict'
import { afterEach, it } from 'vitest'
import {
  CancelledError,
  InfiniteQueryObserver,
  QueryCache,
  QueryClient,
  QueryObserver,
  onlineManager,
} from '..'
import type {
  QueryCacheNotifyEvent,
  QueryFunction,
  QueryFunctionContext,
} from '..'

type UpdatedEvent = Extract<QueryCacheNotifyEvent, { type: 'updated' }>
type SourceEvent = Extract<
  QueryCacheNotifyEvent,
  { type: 'fetchSourceStarted' }
>
type SuccessEvent = UpdatedEvent & {
  action: Extract<UpdatedEvent['action'], { type: 'success' }>
}
type ErrorEvent = UpdatedEvent & {
  action: Extract<UpdatedEvent['action'], { type: 'error' }>
}

function findSuccess(
  events: Array<QueryCacheNotifyEvent>,
  manual: boolean,
): SuccessEvent | undefined {
  return events.find(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      Boolean(event.action.manual) === manual,
  )
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((yes) => {
    resolve = yes
  })
  return { promise, resolve }
}

afterEach(() => {
  onlineManager.setOnline(true)
})

// The imperative entry points on current Query Core also enter Query.fetch.
// Selection changes the returned value without changing cached source provenance.
it('imperative query and infiniteQuery attribute their cached source', async () => {
  const client = new QueryClient()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  let querySource: number | undefined
  let infiniteSource: number | undefined

  const selected = await client.query({
    queryKey: ['imperative-query'],
    queryFn: (context) => {
      querySource = context.sourceSequence
      return { value: 'remote' }
    },
    select: (data) => data.value,
  })
  assert.equal(selected, 'remote')

  const pages = await client.infiniteQuery({
    queryKey: ['imperative-infinite'],
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    queryFn: (context) => {
      infiniteSource = context.sourceSequence
      return context.pageParam
    },
  })
  assert.deepEqual(pages.pages, [1])

  const querySuccess = events.find(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.queryKey[0] === 'imperative-query',
  )
  const infiniteSuccess = events.find(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.queryKey[0] === 'imperative-infinite',
  )
  assert.ok(querySuccess)
  assert.ok(infiniteSuccess)
  assert.ok(querySource)
  assert.ok(infiniteSource)
  assert.equal(querySuccess.sourceSequence, querySource)
  assert.equal(infiniteSuccess.sourceSequence, infiniteSource)
  stop()
  client.clear()
})

// A fetch reserves its accepted position before notifying either observers
// or cache listeners. A direct write admitted during notification is later.
it('accepted fetch precedes a reentrant cache-listener write', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['write-in-start-listener']
  client.setQueryData(key, 'seed')
  let writeSequence: number | undefined
  const events: Array<QueryCacheNotifyEvent> = []
  const stopWriter = cache.subscribe((event) => {
    if (event.type === 'fetchStarted') {
      writeSequence = cache.reserveSequence()
      client.setQueryData(key, 'local')
    }
  })
  const stopRecorder = cache.subscribe((event) => events.push(event))

  assert.equal(
    await client.fetchQuery({ queryKey: key, queryFn: () => 'remote' }),
    'remote',
  )
  const start = events.find((event) => event.type === 'fetchStarted')
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(success)
  assert.ok(writeSequence)
  assert.ok(start.fetchSequence < writeSequence)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.ok(success.sourceSequence)
  assert.ok(success.sourceSequence > writeSequence)
  stopRecorder()
  stopWriter()
  client.clear()
})

// Observers run before the cache's updated event for a fetch. Either callback
// can admit a direct write after the fetch has reserved its position.
it('accepted fetch precedes observer and cache-listener writes', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['write-in-observer']
  client.setQueryData(key, 'seed')
  let observerWriteSequence: number | undefined
  let cacheWriteSequence: number | undefined
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => 'remote',
  })
  const stopObserver = observer.subscribe((result) => {
    if (result.isFetching && observerWriteSequence === undefined) {
      observerWriteSequence = cache.reserveSequence()
      client.setQueryData(key, 'observer-local')
    }
  })
  const events: Array<QueryCacheNotifyEvent> = []
  const stopCache = cache.subscribe((event) => {
    events.push(event)
    if (
      event.type === 'updated' &&
      event.action.type === 'fetch' &&
      cacheWriteSequence === undefined
    ) {
      cacheWriteSequence = cache.reserveSequence()
      client.setQueryData(key, 'cache-local')
    }
  })

  assert.equal((await observer.refetch()).data, 'remote')
  const start = events.find((event) => event.type === 'fetchStarted')
  assert.ok(start)
  assert.ok(observerWriteSequence)
  assert.ok(cacheWriteSequence)
  assert.ok(start.fetchSequence < observerWriteSequence)
  assert.ok(observerWriteSequence < cacheWriteSequence)
  assert.equal(observer.getCurrentResult().data, 'remote')
  stopCache()
  stopObserver()
  client.clear()
})

// A Collection may attach after the fetch and its source invocation started.
// The installed Query exposes both positions without replaying cache events.
it('late attachment can read the installed fetch and source positions', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['late-attachment']
  const response = deferred<string>()
  const pending = client.fetchQuery({
    queryKey: key,
    queryFn: () => response.promise,
  })
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  assert.equal(query.state.fetchStatus, 'fetching')
  const accepted = query.fetchSequence
  const source = query.sourceSequence
  assert.ok(accepted)
  assert.ok(source)
  assert.ok(accepted < source)
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  response.resolve('remote')
  assert.equal(await pending, 'remote')
  const success = findSuccess(events, false)
  assert.ok(success)
  assert.equal(success.fetchSequence, accepted)
  assert.equal(success.sourceSequence, source)
  stop()
  client.clear()
})

// A source event carries the installed retryer's promise. It reports attempt
// settlement and cancellation; applying its rows is a separate boundary.
it('source event promise tracks the active fetch through cancellation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const response = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const pending = client.fetchQuery({
    queryKey: ['source-promise'],
    queryFn: () => response.promise,
  })
  const pendingError = pending.catch((error: unknown) => error)
  const query = cache.find({ queryKey: ['source-promise'] })
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  assert.ok(query)
  assert.ok(source)
  assert.equal(source.promise, query.promise)
  let settled = false
  const sourceResult = source.promise.then(
    (value) => ({ value, error: undefined }),
    (error: unknown) => ({ value: undefined, error }),
  )
  void sourceResult.then(() => {
    settled = true
  })
  await Promise.resolve()
  assert.equal(settled, false)

  await query.cancel()
  const result = await sourceResult
  assert.ok(result.error instanceof CancelledError)
  assert.equal(result.error, await pendingError)
  assert.equal(settled, true)
  response.resolve('late')
  stop()
  client.clear()
})

// A same-meta replacement skips the ordinary fetch action. It still starts a
// distinct operation and cancels the old one with its own accepted position.
it('silent replacement has a distinct start and cancellation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['same-meta-replacement']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const first = deferred<string>()
  const second = deferred<string>()
  const meta = { fetchMore: { direction: 'forward' as const } }
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  const oldFetch = query.fetch(
    { queryKey: key, queryFn: () => first.promise },
    { meta },
  )
  const newFetch = query.fetch(
    { queryKey: key, queryFn: () => second.promise },
    { meta, cancelRefetch: true },
  )
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  const cancelled = events.find((event) => event.type === 'fetchCancelled')
  const fetchActions = events.filter(
    (event) => event.type === 'updated' && event.action.type === 'fetch',
  )
  assert.equal(starts.length, 2)
  assert.equal(sources.length, 2)
  assert.equal(fetchActions.length, 1)
  assert.ok(cancelled)
  assert.equal(cancelled.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(sources[0]!.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(cancelled.sourceSequence, sources[0]!.sourceSequence)
  assert.equal(query.fetchSequence, starts[1]!.fetchSequence)
  second.resolve('newer')
  assert.equal(await newFetch, 'newer')
  assert.equal(await oldFetch, 'newer')
  const success = findSuccess(events, false)
  assert.ok(success)
  assert.equal(success.fetchSequence, starts[1]!.fetchSequence)
  stop()
  client.clear()
})

// Cancellation before a paused fetch reaches its query function has no
// source position. A cancellation event must not invent one.
it('cancelled paused fetch has no source position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['cancel-before-source']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  onlineManager.setOnline(false)
  let queryFnCalls = 0
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  const pending = query.fetch({
    queryKey: key,
    queryFn: () => {
      queryFnCalls++
      return 'remote'
    },
  })
  const start = events.find((event) => event.type === 'fetchStarted')
  assert.ok(start)
  assert.equal(query.state.fetchStatus, 'paused')
  await query.cancel({ revert: true })
  await pending
  const cancelled = events.find((event) => event.type === 'fetchCancelled')
  assert.ok(cancelled)
  assert.equal(cancelled.fetchSequence, start.fetchSequence)
  assert.equal(cancelled.sourceSequence, undefined)
  assert.equal(queryFnCalls, 0)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// Revert restores the last fetched data version, including the source that
// supplied it. The cancelled fetch's later source cannot replace that owner.
it('cancel with revert restores fetched data provenance', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['revert-fetched-source']
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => 'first',
  })
  const stop = observer.subscribe(() => {})
  await observer.refetch()
  const before = observer.getCurrentResult()
  assert.equal(before.data, 'first')
  assert.ok(before.dataFetchSequence)
  assert.ok(before.dataSourceSequence)

  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const later = deferred<string>()
  const pending = query.fetch({ queryKey: key, queryFn: () => later.promise })
  assert.equal(query.state.fetchStatus, 'fetching')
  await query.cancel({ revert: true })
  assert.equal(await pending, 'first')
  const restored = observer.getCurrentResult()
  assert.equal(restored.data, 'first')
  assert.equal(restored.dataFetchSequence, before.dataFetchSequence)
  assert.equal(restored.dataSourceSequence, before.dataSourceSequence)
  assert.equal(query.dataFetchSequence, before.dataFetchSequence)
  assert.equal(query.dataSourceSequence, before.dataSourceSequence)
  later.resolve('later')
  stop()
  client.clear()
})

// Abort listeners run synchronously during cancellation. A behavior can call
// a retained query function from one, but that call is outside the cancelled
// fetch and must not reserve or publish a new source position.
it('abort reentry cannot start a source for the cancelled fetch', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['abort-reentry']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const held = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let abortCalls = 0

  const pending = query.fetch({
    queryKey: key,
    queryFn: () => 'remote',
    behavior: {
      onFetch: (context) => {
        const captured = context.options.queryFn
        assert.ok(typeof captured === 'function')
        const signal = context.signal
        signal.addEventListener('abort', () => {
          abortCalls++
          captured({
            client: context.client,
            queryKey: context.queryKey,
            meta: context.options.meta,
            signal,
            fetchSequence: context.fetchSequence,
          })
        })
        context.fetchFn = () => held.promise
      },
    },
  })
  const beforeCancel = cache.currentSequence
  await query.cancel({ revert: true })
  assert.equal(await pending, 'seed')
  assert.equal(abortCalls, 1)
  assert.equal(cache.currentSequence, beforeCancel)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  const cancelled = events.find((event) => event.type === 'fetchCancelled')
  assert.ok(cancelled)
  assert.equal(cancelled.sourceSequence, undefined)
  held.resolve('ignored')
  stop()
  client.clear()
})

// A second fetch call can join an in-flight retryer instead of starting a new
// operation. Both callers then observe one accepted and one source position.
it('coalesced fetch callers share one operation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['coalesced-fetch']
  const response = deferred<string>()
  let queryFnCalls = 0
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const queryFn = () => {
    queryFnCalls++
    return response.promise
  }

  const first = client.fetchQuery({ queryKey: key, queryFn })
  const second = client.fetchQuery({ queryKey: key, queryFn })
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(queryFnCalls, 1)
  assert.equal(starts.length, 1)
  assert.equal(sources.length, 1)
  assert.equal(sources[0]!.fetchSequence, starts[0]!.fetchSequence)
  response.resolve('remote')
  assert.equal(await first, 'remote')
  assert.equal(await second, 'remote')
  const successes = events.filter(
    (event) => event.type === 'updated' && event.action.type === 'success',
  )
  const success = findSuccess(events, false)
  assert.equal(successes.length, 1)
  assert.ok(success)
  assert.equal(success.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(success.sourceSequence, sources[0]!.sourceSequence)
  stop()
  client.clear()
})

// Fetch positions belong to the QueryCache, not to individual Query keys.
it('fetches on different keys share one ordering clock with writes', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const a = deferred<string>()
  const b = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  const first = client.fetchQuery({ queryKey: ['A'], queryFn: () => a.promise })
  const writeSequence = cache.reserveSequence()
  const second = client.fetchQuery({
    queryKey: ['B'],
    queryFn: () => b.promise,
  })
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(starts.length, 2)
  assert.equal(sources.length, 2)
  assert.ok(starts[0]!.fetchSequence < writeSequence)
  assert.ok(writeSequence < starts[1]!.fetchSequence)
  assert.ok(sources[0]!.sourceSequence < writeSequence)
  assert.ok(writeSequence < sources[1]!.sourceSequence)
  b.resolve('B')
  a.resolve('A')
  assert.equal(await second, 'B')
  assert.equal(await first, 'A')
  const successes = events.filter(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      !event.action.manual,
  )
  assert.equal(successes.length, 2)
  const aSuccess = successes.find((event) => event.query.queryKey[0] === 'A')
  const bSuccess = successes.find((event) => event.query.queryKey[0] === 'B')
  assert.ok(aSuccess)
  assert.ok(bSuccess)
  assert.equal(aSuccess.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(aSuccess.sourceSequence, sources[0]!.sourceSequence)
  assert.equal(bSuccess.fetchSequence, starts[1]!.fetchSequence)
  assert.equal(bSuccess.sourceSequence, sources[1]!.sourceSequence)
  stop()
  client.clear()
})

// The cache clock records actual source invocation separately from fetch
// acceptance. A paused A can start its source after a later accepted B.
it('paused and active keys share source order across the cache', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const a = deferred<string>()
  const b = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  onlineManager.setOnline(false)

  const first = client.fetchQuery({
    queryKey: ['paused-A'],
    queryFn: () => a.promise,
  })
  const writeSequence = cache.reserveSequence()
  const second = client.fetchQuery({
    queryKey: ['active-B'],
    networkMode: 'always',
    queryFn: () => b.promise,
  })
  const starts = events.filter((event) => event.type === 'fetchStarted')
  let sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(starts.length, 2)
  assert.equal(sources.length, 1)
  assert.ok(starts[0]!.fetchSequence < writeSequence)
  assert.ok(writeSequence < starts[1]!.fetchSequence)
  assert.equal(sources[0]!.fetchSequence, starts[1]!.fetchSequence)
  onlineManager.setOnline(true)
  cache.onOnline()
  b.resolve('B')
  a.resolve('A')
  assert.equal(await second, 'B')
  assert.equal(await first, 'A')
  sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(sources.length, 2)
  assert.equal(sources[1]!.fetchSequence, starts[0]!.fetchSequence)
  assert.ok(sources[0]!.sourceSequence < sources[1]!.sourceSequence)
  const successes = events.filter(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      !event.action.manual,
  )
  const aSuccess = successes.find(
    (event) => event.query.queryKey[0] === 'paused-A',
  )
  const bSuccess = successes.find(
    (event) => event.query.queryKey[0] === 'active-B',
  )
  assert.ok(aSuccess)
  assert.ok(bSuccess)
  assert.equal(aSuccess.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(aSuccess.sourceSequence, sources[1]!.sourceSequence)
  assert.equal(bSuccess.fetchSequence, starts[1]!.fetchSequence)
  assert.equal(bSuccess.sourceSequence, sources[0]!.sourceSequence)
  stop()
  client.clear()
})

// Query.setState is an existing public path that can replace data without
// incrementing QueryState.dataUpdateCount. Consumers comparing data versions
// must also compare the data reference.
it('setState data replacement clears source without changing update count', () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['set-state-data']
  const first = [{ id: 1 }]
  const second = [{ id: 2 }]
  client.setQueryData(key, first)
  const query = cache.find<Array<{ id: number }>>({ queryKey: key })
  assert.ok(query)
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
  })
  const stopObserver = observer.subscribe(() => {})
  const before = observer.getCurrentResult()
  const events: Array<QueryCacheNotifyEvent> = []
  const stopCache = cache.subscribe((event) => events.push(event))

  query.setState({ data: second })
  const after = observer.getCurrentResult()
  const changed = events.find(
    (event): event is UpdatedEvent =>
      event.type === 'updated' && event.action.type === 'setState',
  )
  assert.ok(changed)
  assert.equal(before.data, first)
  assert.equal(after.data, second)
  assert.equal(after.dataUpdateCount, before.dataUpdateCount)
  assert.equal(changed.state.dataUpdateCount, before.dataUpdateCount)
  assert.equal(changed.state.data, second)
  assert.equal(after.dataFetchSequence, undefined)
  assert.equal(after.dataSourceSequence, undefined)
  stopCache()
  stopObserver()
  client.clear()
})

// Explicit setState({ data }) is a new data version even if the value is the
// same object. Its provenance cannot be inherited from the earlier fetch.
it('setState with the same data reference clears fetched provenance', async () => {
  const client = new QueryClient()
  const key = ['same-reference-set-state']
  const shared = [{ id: 1 }]
  await client.query({ queryKey: key, queryFn: () => shared })
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(query)
  assert.ok(query.dataFetchSequence)
  assert.ok(query.dataSourceSequence)

  query.setState({ data: shared })
  assert.equal(query.state.data, shared)
  assert.equal(query.dataFetchSequence, undefined)
  assert.equal(query.dataSourceSequence, undefined)
  client.clear()
})

// A query-function failure has a source invocation even though it supplies no
// data. The terminal error event must identify the same accepted fetch and
// source that listeners saw start.
it('terminal fetch error keeps its source position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const failure = new Error('remote failed')
  await assert.rejects(
    client.query({
      queryKey: ['failed-source'],
      queryFn: () => {
        throw failure
      },
    }),
    failure,
  )
  const start = events.find((event) => event.type === 'fetchStarted')
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const terminal = events.find(
    (event): event is UpdatedEvent =>
      event.type === 'updated' && event.action.type === 'error',
  )
  assert.ok(start)
  assert.ok(source)
  assert.ok(terminal)
  assert.equal(source.fetchSequence, start.fetchSequence)
  assert.equal(terminal.fetchSequence, start.fetchSequence)
  assert.equal(terminal.sourceSequence, source.sourceSequence)
  stop()
  client.clear()
})

// A paused operation is accepted before a later direct write, even though its
// source is not invoked until after that write.
it('paused fetch keeps its accepted position after a write', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['paused-before-write']
  client.setQueryData(key, 'seed')
  onlineManager.setOnline(false)
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let functionSequence: number | undefined
  const pending = client.fetchQuery({
    queryKey: key,
    queryFn: (context) => {
      functionSequence = context.fetchSequence
      return 'remote'
    },
  })
  const query = cache.find<string>({ queryKey: key })
  const start = events.find((event) => event.type === 'fetchStarted')
  assert.ok(query)
  assert.ok(start)
  assert.equal(query.state.fetchStatus, 'paused')
  assert.equal(query.sourceSequence, undefined)
  const writeSequence = cache.reserveSequence()
  client.setQueryData(key, 'local')
  onlineManager.setOnline(true)
  cache.onOnline()
  assert.equal(await pending, 'remote')
  const success = findSuccess(events, false)
  assert.ok(success)
  assert.ok(start.fetchSequence < writeSequence)
  assert.equal(functionSequence, start.fetchSequence)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.ok(success.sourceSequence)
  assert.ok(writeSequence < success.sourceSequence)
  stop()
  client.clear()
})

// Retries remain in one accepted operation. Its first source position is a
// conservative start bound, even when a later attempt supplies the value.
it('retry retains positions across an intervening write', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
  })
  const cache = client.getQueryCache()
  const key = ['retry-after-write']
  client.setQueryData(key, 'seed')
  const events: Array<QueryCacheNotifyEvent> = []
  let writeSequence: number | undefined
  const stop = cache.subscribe((event) => {
    events.push(event)
    if (event.type === 'updated' && event.action.type === 'failed') {
      writeSequence = cache.reserveSequence()
      client.setQueryData(key, 'local')
    }
  })
  const calls: Array<[number | undefined, number | undefined]> = []
  const remote = await client.fetchQuery({
    queryKey: key,
    queryFn: (context) => {
      calls.push([context.fetchSequence, context.sourceSequence])
      if (calls.length === 1) throw new Error('retry')
      return 'remote'
    },
  })
  const start = events.find((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(sources.length, 1)
  const source = sources[0]!
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(source)
  assert.ok(success)
  assert.ok(writeSequence)
  assert.equal(remote, 'remote')
  assert.deepEqual(calls, [
    [start.fetchSequence, source.sourceSequence],
    [start.fetchSequence, source.sourceSequence],
  ])
  assert.ok(source.sourceSequence < writeSequence)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, source.sourceSequence)
  stop()
  client.clear()
})

// Recursive Query.fetch can accept A, then B, but invoke B's query function
// before A's. Both facts remain visible; Query Core chooses no winner.
it('recursive fetches keep accepted and source order separate', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['recursive-same-query']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const firstSource = deferred<string>()
  const secondSource = deferred<string>()
  let calls = 0
  let nested: Promise<string> | undefined
  let armed = true
  const events: Array<QueryCacheNotifyEvent> = []
  const queryFn = () =>
    ++calls === 1 ? firstSource.promise : secondSource.promise
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn,
  })
  const results: Array<ReturnType<typeof observer.getCurrentResult>> = []
  const stopObserver = observer.subscribe((result) => results.push(result))
  const stop = cache.subscribe((event) => {
    events.push(event)
    if (event.type === 'updated' && event.action.type === 'fetch' && armed) {
      armed = false
      nested = query.fetch({ queryKey: key, queryFn }, { cancelRefetch: true })
    }
  })

  const outer = query.fetch({ queryKey: key, queryFn }, { cancelRefetch: true })
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(starts.length, 2)
  assert.equal(sources.length, 2)
  assert.ok(starts[0]!.fetchSequence < starts[1]!.fetchSequence)
  assert.ok(sources[0]!.sourceSequence < sources[1]!.sourceSequence)
  assert.equal(sources[0]!.fetchSequence, starts[1]!.fetchSequence)
  assert.equal(sources[1]!.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(query.fetchSequence, starts[1]!.fetchSequence)
  assert.equal(query.sourceSequence, sources[0]!.sourceSequence)
  firstSource.resolve('B')
  assert.ok(nested)
  assert.equal(await nested, 'B')
  const bSuccess = events.find(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data === 'B',
  )
  const bResult = results.find((result) => result.data === 'B')
  assert.ok(bSuccess)
  assert.ok(bResult)
  assert.equal(bSuccess.fetchSequence, starts[1]!.fetchSequence)
  assert.equal(bSuccess.sourceSequence, sources[0]!.sourceSequence)
  assert.equal(bResult.dataFetchSequence, bSuccess.fetchSequence)
  assert.equal(bResult.dataSourceSequence, bSuccess.sourceSequence)
  secondSource.resolve('A')
  assert.equal(await outer, 'A')
  const aSuccess = events.find(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.action.data === 'A',
  )
  const aResult = results.find((result) => result.data === 'A')
  assert.ok(aSuccess)
  assert.ok(aResult)
  assert.equal(aSuccess.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(aSuccess.sourceSequence, sources[1]!.sourceSequence)
  assert.equal(aResult.dataFetchSequence, aSuccess.fetchSequence)
  assert.equal(aResult.dataSourceSequence, aSuccess.sourceSequence)
  stop()
  stopObserver()
  client.clear()
})

// Reentrant fetches can overlap in one Query. A stale fetch's signal read
// cannot make the installed fetch cancellable when its own signal was ignored.
it('stale nested fetch signal consumption does not cancel the current fetch', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['nested-signal-consumption']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const nestedSource = deferred<string>()
  const outerSource = deferred<string>()
  let nestedContext: QueryFunctionContext | undefined
  let nested: Promise<string> | undefined
  let calls = 0
  let armed = true
  const queryFn = (context: QueryFunctionContext) => {
    if (++calls === 1) {
      nestedContext = context
      return nestedSource.promise
    }
    return outerSource.promise
  }
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn,
  })
  const stopObserver = observer.subscribe(() => {})
  const stopCache = cache.subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'fetch' && armed) {
      armed = false
      nested = query.fetch({ queryKey: key, queryFn }, { cancelRefetch: true })
    }
  })

  const outer = query.fetch({ queryKey: key, queryFn }, { cancelRefetch: true })
  assert.ok(nestedContext)
  assert.ok(nested)
  assert.equal(query.state.fetchStatus, 'fetching')
  void nestedContext.signal
  stopObserver()
  assert.equal(query.state.fetchStatus, 'fetching')
  outerSource.resolve('outer')
  assert.equal(await outer, 'outer')
  nestedSource.resolve('nested')
  assert.equal(await nested, 'nested')
  stopCache()
  client.clear()
})

// A delayed stale fetchFn cannot erase consumption by the installed fetch.
// Removing the last observer must still abort the installed fetch's signal.
it('deferred stale fetch does not clear current signal consumption', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['nested-deferred-signal-consumption']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const nestedSource = deferred<string>()
  const outerSource = deferred<string>()
  let outerSignal: AbortSignal | undefined
  let nested: Promise<string> | undefined
  let calls = 0
  let armed = true
  const queryFn = (context: QueryFunctionContext) => {
    if (++calls === 1) {
      outerSignal = context.signal
      return outerSource.promise
    }
    return nestedSource.promise
  }
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn,
  })
  const stopObserver = observer.subscribe(() => {})
  const stopCache = cache.subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'fetch' && armed) {
      armed = false
      nested = query.fetch(
        {
          queryKey: key,
          queryFn,
          behavior: {
            onFetch: (context) => {
              const fetchFn = context.fetchFn
              context.fetchFn = () => Promise.resolve().then(fetchFn)
            },
          },
        },
        { cancelRefetch: true },
      )
    }
  })

  const outer = query.fetch({ queryKey: key, queryFn }, { cancelRefetch: true })
  assert.ok(outerSignal)
  assert.ok(nested)
  await Promise.resolve()
  assert.equal(calls, 2)
  stopObserver()
  assert.equal(outerSignal.aborted, true)
  assert.equal(query.state.fetchStatus, 'idle')
  outerSource.resolve('ignored')
  nestedSource.resolve('ignored')
  await Promise.allSettled([outer, nested])
  stopCache()
  client.clear()
})

// A behavior can consume its fetch signal before the default fetchFn runs.
// The same signal spans retries, so its consumption lasts until settlement.
it('behavior signal consumption survives the default fetchFn', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['behavior-signal-before-fetch-fn']
  client.setQueryData(key, 'seed')
  const response = deferred<string>()
  let behaviorSignal: AbortSignal | undefined
  let abortCalls = 0
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => response.promise,
    behavior: {
      onFetch: (context) => {
        behaviorSignal = context.signal
        behaviorSignal.addEventListener('abort', () => abortCalls++)
      },
    },
  })
  const stopObserver = observer.subscribe(() => {})
  const pending = observer.refetch()
  assert.ok(behaviorSignal)
  stopObserver()
  const aborted = behaviorSignal.aborted
  const observedAbortCalls = abortCalls
  response.resolve('remote')
  await pending
  assert.equal(aborted, true)
  assert.equal(observedAbortCalls, 1)
  client.clear()
})

// A retry shares one fetch signal. Reading it in an earlier attempt keeps
// that fetch cancellable even if the current attempt ignores signal.
it('signal consumption survives a retry whose queryFn ignores signal', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
  })
  const key = ['signal-consumption-across-retry']
  client.setQueryData(key, 'seed')
  const secondStarted = deferred<void>()
  const response = deferred<string>()
  let firstSignal: AbortSignal | undefined
  let attempts = 0
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: (context) => {
      if (++attempts === 1) {
        firstSignal = context.signal
        throw new Error('retry')
      }
      secondStarted.resolve()
      return response.promise
    },
  })
  const stopObserver = observer.subscribe(() => {})
  const pending = observer.refetch()
  await secondStarted.promise
  assert.ok(firstSignal)
  stopObserver()
  const aborted = firstSignal.aborted
  response.resolve('remote')
  await pending
  assert.equal(attempts, 2)
  assert.equal(aborted, true)
  client.clear()
})

// A query function can replace its own fetch before its source notification
// runs. The event must carry the old operation's retryer promise even though
// Query.promise now points at the replacement.
it('reentrant source event keeps its own fetch promise', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['reentrant-source-promise']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const firstSource = deferred<string>()
  const replacementSource = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let firstSequence: number | undefined
  let firstPromise: Promise<string> | undefined
  let replacement: Promise<string> | undefined

  const first = query.fetch({
    queryKey: key,
    queryFn: (context) => {
      firstSequence = context.fetchSequence
      firstPromise = query.promise
      replacement = query.fetch(
        { queryKey: key, queryFn: () => replacementSource.promise },
        { cancelRefetch: true },
      )
      return firstSource.promise
    },
  })
  const firstEvent = events.find(
    (
      event,
    ): event is Extract<
      QueryCacheNotifyEvent,
      { type: 'fetchSourceStarted' }
    > =>
      event.type === 'fetchSourceStarted' &&
      event.fetchSequence === firstSequence,
  )
  assert.ok(firstPromise)
  assert.ok(firstEvent)
  assert.notEqual(query.promise, firstPromise)
  assert.equal(firstEvent.promise, firstPromise)
  await assert.rejects(firstPromise, CancelledError)

  replacementSource.resolve('replacement')
  assert.ok(replacement)
  assert.equal(await replacement, 'replacement')
  assert.equal(await first, 'replacement')
  firstSource.resolve('ignored')
  stop()
  client.clear()
})

// An observer callback can reenter Query Core before the cache listener sees
// the fetched action. That cache event must retain its own state snapshot.
it('fetched event keeps its data version under a same-reference reentrant write', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['snapshot-under-reentry']
  const shared = [{ id: 1 }]
  client.setQueryData(key, shared)
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => shared,
  })
  let fetchedResult: ReturnType<typeof observer.getCurrentResult> | undefined
  let wrote = false
  const stopObserver = observer.subscribe((result) => {
    if (result.dataFetchSequence !== undefined && !wrote) {
      wrote = true
      fetchedResult = result
      client.setQueryData(key, shared, {
        updatedAt: result.dataUpdatedAt + 1,
      })
    }
  })
  const secondObserver = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => shared,
  })
  const secondResults: Array<
    ReturnType<typeof secondObserver.getCurrentResult>
  > = []
  const stopSecondObserver = secondObserver.subscribe((result) =>
    secondResults.push(result),
  )
  const events: Array<QueryCacheNotifyEvent> = []
  const stopCache = client
    .getQueryCache()
    .subscribe((event) => events.push(event))

  await observer.refetch()
  const fetched = findSuccess(events, false)
  const manual = findSuccess(events, true)
  assert.ok(fetched)
  assert.ok(manual)
  assert.ok(fetchedResult)
  assert.equal(fetched.action.data, manual.action.data)
  assert.equal(fetched.state.dataUpdateCount + 1, manual.state.dataUpdateCount)
  assert.equal(fetched.state.dataUpdatedAt + 1, manual.state.dataUpdatedAt)
  assert.equal(fetchedResult.dataUpdateCount, fetched.state.dataUpdateCount)
  assert.equal(fetchedResult.dataFetchSequence, fetched.fetchSequence)
  assert.equal(fetchedResult.dataSourceSequence, fetched.sourceSequence)
  assert.equal(
    fetched.query.state.dataUpdateCount,
    manual.state.dataUpdateCount,
  )
  const secondManualResult = secondResults.find(
    (result) => result.dataUpdateCount === manual.state.dataUpdateCount,
  )
  assert.ok(secondManualResult)
  assert.equal(secondManualResult.dataFetchSequence, undefined)
  assert.equal(secondManualResult.dataSourceSequence, undefined)
  stopCache()
  stopSecondObserver()
  stopObserver()
  client.clear()
})

// A select callback can also reenter Query Core while createResult is building
// an older result. Its version and source must come from one state snapshot.
it('observer result keeps its source when select makes a nested write', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['select-reentry']
  const seed = [{ id: 0 }]
  const fetchedRows = [{ id: 1 }]
  client.setQueryData(key, seed)
  let wrote = false
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => fetchedRows,
    select: (rows) => {
      if (rows[0]?.id === 1 && !wrote) {
        wrote = true
        client.setQueryData(key, rows, { updatedAt: Date.now() + 1 })
      }
      return rows
    },
  })
  const results: Array<ReturnType<typeof observer.getCurrentResult>> = []
  const stopObserver = observer.subscribe((result) => results.push(result))
  const events: Array<QueryCacheNotifyEvent> = []
  const stopCache = client
    .getQueryCache()
    .subscribe((event) => events.push(event))

  await observer.refetch()
  const fetched = findSuccess(events, false)
  const manual = findSuccess(events, true)
  assert.ok(fetched)
  assert.ok(manual)
  assert.equal(fetched.action.data, manual.action.data)
  const fetchedResult = results.find(
    (result) => result.dataUpdateCount === fetched.state.dataUpdateCount,
  )
  assert.ok(fetchedResult)
  assert.equal(fetchedResult.dataFetchSequence, fetched.fetchSequence)
  assert.equal(fetchedResult.dataSourceSequence, fetched.sourceSequence)
  const manualResult = results.find(
    (result) => result.dataUpdateCount === manual.state.dataUpdateCount,
  )
  assert.ok(manualResult)
  assert.equal(manualResult.dataFetchSequence, undefined)
  assert.equal(manualResult.dataSourceSequence, undefined)
  stopCache()
  stopObserver()
  client.clear()
})

// A failed select returns the last selected value. Its attribution must stay
// with that value even though Query Core cached a newer raw fetch result.
it('select-error fallback keeps the previous selected data version', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['select-error-provenance']
  let source = { id: 1 }
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => source,
    select: (row) => {
      if (row.id === 2) throw new Error('select failed')
      return `selected-${row.id}`
    },
  })
  const stop = observer.subscribe(() => {})
  await observer.refetch()
  const first = observer.getCurrentResult()
  assert.equal(first.data, 'selected-1')
  assert.ok(first.dataUpdateCount)
  assert.ok(first.dataFetchSequence)
  assert.ok(first.dataSourceSequence)

  source = { id: 2 }
  await observer.refetch()
  const fallback = observer.getCurrentResult()
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(query)
  assert.equal(fallback.status, 'error')
  assert.equal(fallback.data, 'selected-1')
  assert.ok(query.state.dataUpdateCount > first.dataUpdateCount)
  assert.equal(fallback.dataUpdateCount, first.dataUpdateCount)
  assert.equal(fallback.dataFetchSequence, first.dataFetchSequence)
  assert.equal(fallback.dataSourceSequence, first.dataSourceSequence)
  stop()
  client.clear()
})

// Structural sharing can keep the same data reference after a successful
// fetch. The observer result still identifies the new source.
it('same-reference success advances the observer source positions', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['same-reference']
  const shared = [{ id: 1 }]
  client.setQueryData(key, shared)
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => shared,
  })
  const stop = observer.subscribe(() => {})
  await observer.refetch()
  const first = observer.getCurrentResult()
  await observer.refetch()
  const second = observer.getCurrentResult()
  assert.equal(first.data, shared)
  assert.equal(second.data, shared)
  assert.notEqual(first.dataFetchSequence, second.dataFetchSequence)
  assert.notEqual(first.dataSourceSequence, second.dataSourceSequence)
  stop()
  client.clear()
})

// An initialPromise can have started outside this QueryCache. It has an
// accepted position here, but no invented source-invocation position.
it('initialPromise has no source position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['initial-promise']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const initial = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const pending = query.fetch(
    { queryKey: key, queryFn: () => 'unused' },
    { initialPromise: initial.promise },
  )
  const start = events.find((event) => event.type === 'fetchStarted')
  assert.ok(start)
  assert.equal(query.sourceSequence, undefined)
  initial.resolve('remote')
  assert.equal(await pending, 'remote')
  const success = findSuccess(events, false)
  assert.ok(success)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// An infinite forward fetch with no next page replays cached data without
// invoking the user's query function. It must not claim a new source.
it('no-next-page replay has no source invocation position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['no-next-page']
  let queryFnCalls = 0
  const observer = new InfiniteQueryObserver<number>(client, {
    queryKey: key,
    enabled: false,
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    queryFn: () => {
      queryFnCalls++
      return 1
    },
  })
  const stopObserver = observer.subscribe(() => {})
  await observer.refetch()
  assert.equal(queryFnCalls, 1)
  const events: Array<QueryCacheNotifyEvent> = []
  let writeSequence: number | undefined
  const stopCache = cache.subscribe((event) => {
    events.push(event)
    if (event.type === 'fetchStarted' && writeSequence === undefined) {
      writeSequence = cache.reserveSequence()
      client.setQueryData(key, { pages: [2], pageParams: [1] })
    }
  })

  await observer.fetchNextPage()
  const start = events.find((event) => event.type === 'fetchStarted')
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(success)
  assert.ok(writeSequence)
  assert.ok(start.fetchSequence < writeSequence)
  assert.equal(queryFnCalls, 1)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stopCache()
  stopObserver()
  client.clear()
})

// An infinite result can combine a directly written earlier page with a new
// page. Its source sequence bounds the fetch operation; it is not provenance
// for every page in the combined result.
it('infinite page append reports an operation source for mixed-page data', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['mixed-infinite-pages']
  const observer = new InfiniteQueryObserver<string>(client, {
    queryKey: key,
    enabled: false,
    initialPageParam: 1,
    getNextPageParam: (_lastPage, pages) =>
      pages.length < 2 ? pages.length + 1 : undefined,
    queryFn: (context) => `remote-${context.pageParam}`,
  })
  const stopObserver = observer.subscribe(() => {})
  await observer.refetch()
  const writeSequence = cache.reserveSequence()
  client.setQueryData(key, { pages: ['manual-1'], pageParams: [1] })
  assert.equal(observer.getCurrentResult().dataSourceSequence, undefined)

  const next = await observer.fetchNextPage()
  assert.deepEqual(next.data?.pages, ['manual-1', 'remote-2'])
  assert.ok(next.dataSourceSequence)
  assert.ok(writeSequence < next.dataSourceSequence)
  stopObserver()
  client.clear()
})

// A multi-page refetch invokes the user queryFn more than once but belongs to
// one accepted operation and one first source invocation.
it('multi-page refetch keeps one source position across page calls', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['multi-page-source']
  let refetching = false
  let betweenPages: number | undefined
  const contexts: Array<[number | undefined, number | undefined]> = []
  const observer = new InfiniteQueryObserver<number>(client, {
    queryKey: key,
    enabled: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage < 2 ? lastPage + 1 : undefined),
    queryFn: (context) => {
      if (refetching) {
        contexts.push([context.fetchSequence, context.sourceSequence])
        if (contexts.length === 1) betweenPages = cache.reserveSequence()
      }
      return Number(context.pageParam)
    },
  })
  const stopObserver = observer.subscribe(() => {})
  await observer.refetch()
  await observer.fetchNextPage()
  assert.deepEqual(observer.getCurrentResult().data?.pages, [1, 2])
  const events: Array<QueryCacheNotifyEvent> = []
  const stopCache = cache.subscribe((event) => events.push(event))

  refetching = true
  await observer.refetch()
  const start = events.find((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(success)
  assert.ok(betweenPages)
  assert.equal(sources.length, 1)
  assert.equal(contexts.length, 2)
  assert.deepEqual(contexts[0], contexts[1])
  assert.equal(contexts[0]![0], start.fetchSequence)
  assert.equal(contexts[0]![1], sources[0]!.sourceSequence)
  assert.ok(sources[0]!.sourceSequence < betweenPages)
  assert.equal(success.sourceSequence, sources[0]!.sourceSequence)
  stopCache()
  stopObserver()
  client.clear()
})

// A behavior may supply a receiver when invoking queryFn. Tracking its
// invocation must keep that receiver and the function's result.
it('custom behavior queryFn call preserves its receiver', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['behavior-query-fn-receiver']
  const owner = { value: 'remote' }
  let functionSourceSequence: number | undefined
  const queryFn: QueryFunction<string, typeof key> = function (
    this: typeof owner,
    context,
  ) {
    functionSourceSequence = context.sourceSequence
    return this.value
  }
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          const tracked = context.options.queryFn
          assert.ok(typeof tracked === 'function')
          context.fetchFn = () =>
            tracked.call(owner, {
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
            })
        },
      },
    }),
    owner.value,
  )
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  assert.ok(source)
  assert.equal(source.sourceSequence, functionSourceSequence)
  stop()
  client.clear()
})

// A public behavior may replace fetchFn and invoke context.options.queryFn
// itself. The invocation is observed, but the replacement controls the result.
it('custom behavior records queryFn invocation without claiming data source', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['custom-behavior']
  let functionSourceSequence: number | undefined
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: (context) => {
      functionSourceSequence = context.sourceSequence
      return 'remote'
    },
    behavior: {
      onFetch: (context) => {
        context.fetchFn = () => {
          const queryFn = context.options.queryFn
          assert.ok(typeof queryFn === 'function')
          return queryFn({
            client: context.client,
            queryKey: context.queryKey,
            meta: context.options.meta,
            signal: context.signal,
          })
        }
      },
    },
  })
  const stopObserver = observer.subscribe(() => {})

  assert.equal((await observer.refetch()).data, 'remote')
  const start = events.find((event) => event.type === 'fetchStarted')
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(source)
  assert.ok(success)
  assert.equal(source.fetchSequence, start.fetchSequence)
  assert.equal(functionSourceSequence, source.sourceSequence)
  assert.equal(success.sourceSequence, undefined)
  stopObserver()
  stop()
  client.clear()
})

// A behavior may obtain queryFn through an own-property descriptor, including
// after sealing writable options. Its invocation starts the tracked source.
it.each(['plain', 'sealed'] as const)(
  'custom behavior attributes queryFn read through its %s descriptor',
  async (optionForm) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const cache = client.getQueryCache()
    const key = ['descriptor-query-fn']
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => events.push(event))
    let functionSourceSequence: number | undefined

    assert.equal(
      await client.fetchQuery({
        queryKey: key,
        queryFn: (context) => {
          functionSourceSequence = context.sourceSequence
          return 'remote'
        },
        behavior: {
          onFetch: (context) => {
            if (optionForm === 'sealed') Object.seal(context.options)
            const queryFn = Object.getOwnPropertyDescriptor(
              context.options,
              'queryFn',
            )?.value as QueryFunction<string, typeof key> | undefined
            assert.ok(queryFn)
            context.fetchFn = () =>
              queryFn({
                client: context.client,
                queryKey: context.queryKey,
                meta: context.options.meta,
                signal: context.signal,
              })
          },
        },
      }),
      'remote',
    )
    const source = events.find((event) => event.type === 'fetchSourceStarted')
    assert.ok(source)
    assert.equal(functionSourceSequence, source.sourceSequence)
    stop()
    client.clear()
  },
)

// A configurable accessor descriptor can also return queryFn. Calling that
// descriptor getter must preserve the same source attribution as a property read.
it('custom behavior attributes queryFn from an accessor descriptor', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['accessor-descriptor-query-fn']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let functionSourceSequence: number | undefined
  const queryFn: QueryFunction<string, typeof key> = (context) => {
    functionSourceSequence = context.sourceSequence
    return 'remote'
  }

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          Object.defineProperty(context.options, 'queryFn', {
            get: () => queryFn,
            configurable: true,
            enumerable: true,
          })
          const descriptor = Object.getOwnPropertyDescriptor(
            context.options,
            'queryFn',
          )
          assert.ok(descriptor?.get)
          const fromDescriptor = descriptor.get.call(
            context.options,
          ) as QueryFunction<string, typeof key>
          context.fetchFn = () =>
            fromDescriptor({
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
            })
        },
      },
    }),
    'remote',
  )
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(sources.length, 1)
  const source = sources[0]!
  assert.equal(functionSourceSequence, source.sourceSequence)
  stop()
  client.clear()
})

// Unrelated option writes cannot make a stable queryFn accessor appear to
// change identity during the same behavior setup.
it('custom behavior keeps a stable queryFn descriptor getter identity', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['stable-query-fn-getter']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const queryFn: QueryFunction<string, typeof key> = () => 'remote'

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          Object.defineProperty(context.options, 'queryFn', {
            get: () => queryFn,
            configurable: true,
            enumerable: true,
          })
          const first = Object.getOwnPropertyDescriptor(
            context.options,
            'queryFn',
          )?.get
          context.options.meta = { changed: true }
          const second = Object.getOwnPropertyDescriptor(
            context.options,
            'queryFn',
          )?.get
          assert.ok(first)
          assert.equal(second, first)
          const tracked = first.call(context.options) as QueryFunction<
            string,
            typeof key
          >
          context.fetchFn = () =>
            tracked({
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
            })
        },
      },
    }),
    'remote',
  )
  assert.equal(
    events.filter((event) => event.type === 'fetchSourceStarted').length,
    1,
  )
  stop()
  client.clear()
})

// A sealed accessor still permits a property read to return a tracked function.
// Its descriptor getter is fixed by Proxy invariants and remains unwrapped.
it('custom behavior attributes queryFn read from a sealed accessor', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['sealed-accessor-query-fn']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let functionSourceSequence: number | undefined
  const queryFn: QueryFunction<string, typeof key> = (context) => {
    functionSourceSequence = context.sourceSequence
    return 'remote'
  }

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          Object.defineProperty(context.options, 'queryFn', {
            get: () => queryFn,
            configurable: true,
            enumerable: true,
          })
          Object.seal(context.options)
          const fromProperty = context.options.queryFn
          assert.ok(typeof fromProperty === 'function')
          context.fetchFn = () =>
            fromProperty({
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
            })
        },
      },
    }),
    'remote',
  )
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  assert.ok(source)
  assert.equal(functionSourceSequence, source.sourceSequence)
  stop()
  client.clear()
})

// A behavior can forward the fetch context's own signal getter with its
// original or a copied query key while omitting fetchSequence. Inspection must
// identify the fetch without consuming the getter. When user code ignores
// signal, removing the last observer leaves the source running for caching.
it.each(['original', 'copied'] as const)(
  'custom behavior attributes a getter-backed context with %s query key',
  async (keyForm) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const cache = client.getQueryCache()
    const key = ['getter-backed-behavior-context']
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => events.push(event))
    const response = deferred<string>()
    let functionSourceSequence: number | undefined
    let sequenceAtFunction: number | undefined
    let forwardedContext: QueryFunctionContext<typeof key> | undefined

    const observer = new QueryObserver(client, {
      queryKey: key,
      enabled: false,
      queryFn: (context) => {
        functionSourceSequence = context.sourceSequence
        sequenceAtFunction = cache.currentSequence
        return response.promise
      },
      behavior: {
        onFetch: (context) => {
          const queryFn = context.options.queryFn
          assert.ok(typeof queryFn === 'function')
          const signal = Object.getOwnPropertyDescriptor(context, 'signal')
          assert.ok(signal?.get)
          forwardedContext = Object.defineProperty(
            {
              client: context.client,
              queryKey:
                keyForm === 'copied' ? [...context.queryKey] : context.queryKey,
              meta: context.options.meta,
            },
            'signal',
            signal,
          ) as QueryFunctionContext<typeof key>
          context.fetchFn = () => queryFn(forwardedContext!)
        },
      },
    })
    const stopObserver = observer.subscribe(() => {})
    const pending = observer.refetch()
    const query = cache.find({ queryKey: key })
    assert.ok(query)
    assert.equal(query.state.fetchStatus, 'fetching')
    stopObserver()
    assert.ok(forwardedContext)
    assert.equal(forwardedContext.signal.aborted, false)
    assert.equal(query.state.fetchStatus, 'fetching')
    response.resolve('remote')
    assert.equal((await pending).data, 'remote')
    const start = events.find((event) => event.type === 'fetchStarted')
    const source = events.find((event) => event.type === 'fetchSourceStarted')
    const success = findSuccess(events, false)
    assert.ok(start)
    assert.ok(source)
    assert.ok(success)
    assert.equal(source.fetchSequence, start.fetchSequence)
    assert.equal(functionSourceSequence, source.sourceSequence)
    assert.equal(sequenceAtFunction, source.sourceSequence)
    assert.equal(success.sourceSequence, undefined)
    stop()
    client.clear()
  },
)

// The signal belongs to one fetch even when a behavior copies the query key
// into a fresh array. Key identity does not establish source ownership.
it('custom behavior attributes its signal with a copied query key', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['copied-behavior-key']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let functionSourceSequence: number | undefined

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn: (context) => {
        functionSourceSequence = context.sourceSequence
        return 'remote'
      },
      behavior: {
        onFetch: (context) => {
          const queryFn = context.options.queryFn
          assert.ok(typeof queryFn === 'function')
          context.fetchFn = () =>
            queryFn({
              client: context.client,
              queryKey: [...context.queryKey],
              meta: context.options.meta,
              signal: context.signal,
            })
        },
      },
    }),
    'remote',
  )
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  assert.ok(source)
  assert.equal(functionSourceSequence, source.sourceSequence)
  stop()
  client.clear()
})

// FetchContext.options used to be the Query's options object. A behavior may
// replace its queryFn before the default fetchFn reads it.
it('custom behavior queryFn replacement preserves option mutation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['behavior-replaces-query-fn']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => 'original',
    behavior: {
      onFetch: (context, query) => {
        const original = context.options.queryFn
        assert.equal(context.options.queryFn, original)
        const replacement = () => 'replacement'
        context.options.queryFn = replacement
        const wrappedReplacement = context.options.queryFn
        assert.equal(context.options.queryFn, wrappedReplacement)
        assert.notEqual(wrappedReplacement, original)
        assert.equal(query.options.queryFn, replacement)
      },
    },
  })
  const stopObserver = observer.subscribe(() => {})

  assert.equal((await observer.refetch()).data, 'replacement')
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  assert.ok(source)
  assert.ok(success)
  assert.equal(success.sourceSequence, source.sourceSequence)
  stopObserver()
  stop()
  client.clear()
})

// A behavior may assign an option back to itself. That must not store a
// fetch-local tracking wrapper as the Query's function for its next fetch.
it('custom behavior queryFn self-assignment keeps each fetch source', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['behavior-self-assignment']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const contexts: Array<[number | undefined, number | undefined]> = []
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let calls = 0
  const queryFn = (context: {
    fetchSequence?: number
    sourceSequence?: number
  }) => {
    contexts.push([context.fetchSequence, context.sourceSequence])
    return `remote-${++calls}`
  }
  assert.equal(
    await query.fetch({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          // oxlint-disable-next-line eslint/no-self-assign -- exercise a behavior that writes back the tracked property
          context.options.queryFn = context.options.queryFn
        },
      },
    }),
    'remote-1',
  )
  assert.equal(query.options.queryFn, queryFn)
  assert.equal(await query.fetch(), 'remote-2')
  assert.equal(query.options.queryFn, queryFn)
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  const successes = events.filter(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      !event.action.manual,
  )
  assert.equal(sources.length, 2)
  assert.equal(successes.length, 2)
  assert.equal(contexts.length, 2)
  assert.deepEqual(contexts, [
    [successes[0]!.fetchSequence, successes[0]!.sourceSequence],
    [successes[1]!.fetchSequence, successes[1]!.sourceSequence],
  ])
  stop()
  client.clear()
})

// A behavior may copy its options back into Query. The tracked queryFn is
// fetch-local, so the stored options must keep the user function across
// consecutive and long histories of fetches.
it('copying behavior options does not retain queryFn wrappers', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['copied-behavior-options']
  let calls = 0
  let sources = 0
  const queryFn = () => ++calls
  let retainedQueryFn: QueryFunction<number, typeof key> | undefined
  const stop = cache.subscribe((event) => {
    if (event.type === 'fetchSourceStarted') sources++
  })
  const query = cache.build(client, {
    queryKey: key,
    queryFn,
    behavior: {
      onFetch: (context) => {
        const trackedQueryFn = context.options.queryFn
        assert.ok(typeof trackedQueryFn === 'function')
        retainedQueryFn ??= trackedQueryFn
        query.setOptions({ ...context.options })
      },
    },
  })

  assert.equal(await query.fetch(), 1)
  assert.equal(query.options.queryFn, queryFn)
  assert.ok(retainedQueryFn)
  // A later write may reuse a wrapper captured by the first fetch.
  query.setOptions({ ...query.options, queryFn: retainedQueryFn })
  assert.equal(query.options.queryFn, queryFn)
  assert.equal(await query.fetch(), 2)
  assert.equal(query.options.queryFn, queryFn)
  assert.equal(sources, 2)
  for (let expected = 3; expected <= 16_000; expected++) {
    assert.equal(await query.fetch(), expected)
  }
  assert.equal(sources, calls)
  assert.equal(query.options.queryFn, queryFn)
  stop()
  client.clear()
})

// Defining queryFn on the behavior's options is another legal write path.
// It must not persist the fetch-local tracked function across later fetches.
it('defining behavior queryFn does not retain its tracked wrapper', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['defined-behavior-query-fn']
  const queryFn = () => 'remote'
  const query = client.getQueryCache().build(client, {
    queryKey: key,
    queryFn,
    behavior: {
      onFetch: (context) => {
        Object.defineProperty(context.options, 'queryFn', {
          value: context.options.queryFn,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      },
    },
  })

  assert.equal(await query.fetch(), 'remote')
  assert.equal(query.options.queryFn, queryFn)
  for (let i = 0; i < 16_000; i++) {
    assert.equal(await query.fetch(), 'remote')
  }
  assert.equal(query.options.queryFn, queryFn)
  client.clear()
})

// An accessor can return a captured tracked queryFn, or a behavior can copy
// the Proxy's accessor descriptor back to its options. Neither path may add
// a wrapper layer on every fetch.
it.each(['captured function', 'copied descriptor'] as const)(
  'accessor with %s does not accumulate queryFn wrappers',
  async (path) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const key = ['accessor-wrapper-retention', path]
    const queryFn = () => 'remote'
    let installedAccessor = false
    const query = client.getQueryCache().build(client, {
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          if (path === 'captured function') {
            const captured = context.options.queryFn
            Object.defineProperty(context.options, 'queryFn', {
              get: () => captured,
              configurable: true,
              enumerable: true,
            })
            return
          }
          if (!installedAccessor) {
            Object.defineProperty(context.options, 'queryFn', {
              get: () => queryFn,
              configurable: true,
              enumerable: true,
            })
            installedAccessor = true
          }
          const descriptor = Object.getOwnPropertyDescriptor(
            context.options,
            'queryFn',
          )
          assert.ok(descriptor)
          Object.defineProperty(context.options, 'queryFn', descriptor)
        },
      },
    })

    for (let i = 0; i < 16_000; i++) {
      assert.equal(await query.fetch(), 'remote')
    }
    client.clear()
  },
)

// Freezing the behavior's options leaves queryFn readable. A Proxy must
// report the target's exact value for a frozen data property.
it('freezing behavior options keeps queryFn readable', async () => {
  const client = new QueryClient()
  const key = ['frozen-behavior-options']
  const queryFn = () => 'remote'
  const query = client.getQueryCache().build(client, {
    queryKey: key,
    queryFn,
    behavior: {
      onFetch: (context) => {
        Object.freeze(context.options)
        assert.equal(context.options.queryFn, queryFn)
        assert.equal(
          Object.getOwnPropertyDescriptor(context.options, 'queryFn')?.value,
          queryFn,
        )
      },
    },
  })
  assert.equal(await query.fetch(), 'remote')
  assert.equal(await query.fetch(), 'remote')
  client.clear()
})

// A behavior can retain a tracked queryFn inside its own replacement. A
// later fetch must not let that old wrapper stamp its source onto new context.
it('custom behavior retained queryFn wrapper keeps later source', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['behavior-retained-wrapper']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const contexts: Array<[number | undefined, number | undefined]> = []
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let calls = 0
  let wrapped = false
  const queryFn = (context: {
    fetchSequence?: number
    sourceSequence?: number
  }) => {
    contexts.push([context.fetchSequence, context.sourceSequence])
    return `remote-${++calls}`
  }

  assert.equal(
    await query.fetch({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          if (wrapped) return
          wrapped = true
          const captured = context.options.queryFn
          assert.ok(typeof captured === 'function')
          context.options.queryFn = (queryFnContext) => captured(queryFnContext)
        },
      },
    }),
    'remote-1',
  )
  assert.equal(await query.fetch(), 'remote-2')
  const successes = events.filter(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      !event.action.manual,
  )
  assert.equal(successes.length, 2)
  assert.deepEqual(contexts, [
    [successes[0]!.fetchSequence, successes[0]!.sourceSequence],
    [successes[1]!.fetchSequence, successes[1]!.sourceSequence],
  ])
  stop()
  client.clear()
})

// A custom behavior may rebuild the query function's context and omit the
// optional fetchSequence. A wrapper retained from an earlier fetch must leave
// the current fetch's source position on that context.
it('retained queryFn wrapper accepts a later context without fetchSequence', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['behavior-omitted-fetch-sequence']
  const events: Array<QueryCacheNotifyEvent> = []
  const contexts: Array<[number | undefined, number | undefined]> = []
  const stop = cache.subscribe((event) => events.push(event))
  let wrapped = false
  let calls = 0
  const queryFn = (context: QueryFunctionContext) => {
    contexts.push([context.fetchSequence, context.sourceSequence])
    return `remote-${++calls}`
  }
  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn,
      behavior: {
        onFetch: (context) => {
          if (wrapped) return
          wrapped = true
          const captured = context.options.queryFn
          assert.ok(typeof captured === 'function')
          context.options.queryFn = (queryFnContext) =>
            captured({
              client: queryFnContext.client,
              queryKey: queryFnContext.queryKey,
              meta: queryFnContext.meta,
              signal: queryFnContext.signal,
              sourceSequence: queryFnContext.sourceSequence,
            })
        },
      },
    }),
    'remote-1',
  )
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  assert.equal(await query.fetch(), 'remote-2')
  const successes = events.filter(
    (event): event is SuccessEvent =>
      event.type === 'updated' &&
      event.action.type === 'success' &&
      !event.action.manual,
  )
  assert.equal(successes.length, 2)
  assert.deepEqual(contexts, [
    [undefined, successes[0]!.sourceSequence],
    [undefined, successes[1]!.sourceSequence],
  ])
  stop()
  client.clear()
})

// Cache sequences start independently. A wrapper captured by one client must
// not emit a source event when another client invokes it during the first fetch.
it('retained queryFn wrapper does not attribute a second cache with the same sequence', async () => {
  const firstClient = new QueryClient()
  const releaseFirst = deferred<string>()
  const firstEvents: Array<QueryCacheNotifyEvent> = []
  const stopFirst = firstClient
    .getQueryCache()
    .subscribe((event) => firstEvents.push(event))
  let invokeCaptured: ((context: QueryFunctionContext) => unknown) | undefined

  const first = firstClient.fetchQuery({
    queryKey: ['first-cache'],
    queryFn: () => 'remote',
    behavior: {
      onFetch: (context) => {
        const captured = context.options.queryFn
        assert.ok(typeof captured === 'function')
        invokeCaptured = (queryFnContext) => captured(queryFnContext)
        context.fetchFn = () => releaseFirst.promise
      },
    },
  })
  const firstQuery = firstClient
    .getQueryCache()
    .find({ queryKey: ['first-cache'] })
  assert.ok(firstQuery)
  assert.equal(firstQuery.state.fetchStatus, 'fetching')

  const secondClient = new QueryClient()
  const secondEvents: Array<QueryCacheNotifyEvent> = []
  const stopSecond = secondClient
    .getQueryCache()
    .subscribe((event) => secondEvents.push(event))
  assert.equal(
    await secondClient.fetchQuery({
      queryKey: ['second-cache'],
      queryFn: (context) => {
        assert.ok(invokeCaptured)
        return invokeCaptured(context) as string
      },
    }),
    'remote',
  )
  const firstStart = firstEvents.find((event) => event.type === 'fetchStarted')
  const secondStart = secondEvents.find(
    (event) => event.type === 'fetchStarted',
  )
  assert.ok(firstStart)
  assert.ok(secondStart)
  assert.equal(firstStart.fetchSequence, secondStart.fetchSequence)
  assert.equal(
    firstEvents.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  releaseFirst.resolve('cached')
  assert.equal(await first, 'cached')
  assert.equal(firstQuery.dataSourceSequence, undefined)
  stopFirst()
  stopSecond()
  firstClient.clear()
  secondClient.clear()
})

// Two Queries in one cache share a clock and can use the same query key with
// different hash functions. A context rebuilt from the other Query, whether
// its signal is a value or that Query's getter, cannot claim the paused fetch.
it('retained queryFn wrapper does not attribute another Query when its context omits fetchSequence', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['shared-key']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let captured:
    | ((context: QueryFunctionContext<typeof key>) => unknown)
    | undefined
  onlineManager.setOnline(false)

  const first = client.fetchQuery({
    queryKey: key,
    queryKeyHashFn: () => 'paused-query-hash',
    queryFn: () => 'first-remote',
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        captured = queryFn
      },
    },
  })
  const firstResult = first.catch((error: unknown) => error)
  const paused = cache.get('paused-query-hash')
  assert.ok(paused)
  assert.equal(paused.state.fetchStatus, 'paused')
  assert.equal(paused.sourceSequence, undefined)

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryKeyHashFn: () => 'active-query-hash',
      networkMode: 'always',
      queryFn: (context) => {
        assert.ok(captured)
        assert.equal(context.queryKey, paused.queryKey)
        assert.equal(
          captured({
            client: context.client,
            queryKey: context.queryKey,
            meta: context.meta,
            signal: context.signal,
          }),
          'first-remote',
        )
        const signal = Object.getOwnPropertyDescriptor(context, 'signal')
        assert.ok(signal?.get)
        const getterContext = Object.defineProperty(
          {
            client: context.client,
            queryKey: context.queryKey,
            meta: context.meta,
          },
          'signal',
          signal,
        ) as QueryFunctionContext<typeof key>
        return captured(getterContext) as string
      },
    }),
    'first-remote',
  )
  assert.equal(paused.sourceSequence, undefined)
  assert.equal(
    events.some(
      (event) => event.type === 'fetchSourceStarted' && event.query === paused,
    ),
    false,
  )
  await paused.cancel({ revert: true })
  assert.ok(await firstResult)
  stop()
  client.clear()
})

// Custom behaviors may pass immutable QueryFunctionContext values. Recording
// provenance must not prevent their query functions from running.
it('custom behavior accepts a frozen query function context', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let frozenContext: QueryFunctionContext | undefined

  assert.equal(
    await client.fetchQuery({
      queryKey: ['frozen-context'],
      queryFn: () => 'remote',
      behavior: {
        onFetch: (context) => {
          const queryFn = context.options.queryFn
          assert.ok(typeof queryFn === 'function')
          frozenContext = Object.freeze({
            client: context.client,
            queryKey: context.queryKey,
            meta: context.options.meta,
            signal: context.signal,
            fetchSequence: context.fetchSequence,
          })
          context.fetchFn = () => queryFn(frozenContext!)
        },
      },
    }),
    'remote',
  )
  assert.ok(frozenContext)
  assert.equal(frozenContext.sourceSequence, undefined)
  assert.equal(
    events.filter((event) => event.type === 'fetchSourceStarted').length,
    1,
  )
  stop()
  client.clear()
})

// A read-only Proxy may reject assignment to optional attribution metadata.
// The instrumentation must still call the user's query function.
it('custom behavior accepts a read-only proxy query function context', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let queryFnCalls = 0

  assert.equal(
    await client.fetchQuery({
      queryKey: ['proxy-context'],
      queryFn: () => {
        queryFnCalls++
        return 'remote'
      },
      behavior: {
        onFetch: (context) => {
          const queryFn = context.options.queryFn
          assert.ok(typeof queryFn === 'function')
          const proxyContext = new Proxy(
            {
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
              fetchSequence: context.fetchSequence,
            },
            {
              set: () => {
                throw new TypeError('read-only context')
              },
            },
          )
          context.fetchFn = () => queryFn(proxyContext)
        },
      },
    }),
    'remote',
  )
  assert.equal(queryFnCalls, 1)
  assert.equal(
    events.filter((event) => event.type === 'fetchSourceStarted').length,
    1,
  )
  stop()
  client.clear()
})

// Optional attribution fields can be inaccessible on an otherwise usable
// Proxy context. Inspection failure means unknown provenance, not query failure.
it('custom behavior runs queryFn when proxy attribution fields throw on inspection', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let queryFnCalls = 0

  for (const inaccessible of ['fetchSequence', 'signalDescriptor'] as const) {
    assert.equal(
      await client.fetchQuery({
        queryKey: ['inaccessible-context', inaccessible],
        queryFn: () => {
          queryFnCalls++
          return 'remote'
        },
        behavior: {
          onFetch: (context) => {
            const queryFn = context.options.queryFn
            assert.ok(typeof queryFn === 'function')
            const proxyContext = new Proxy(
              {
                client: context.client,
                queryKey: context.queryKey,
                meta: context.options.meta,
                signal: context.signal,
              },
              {
                get: (target, property, receiver) => {
                  if (
                    inaccessible === 'fetchSequence' &&
                    property === 'fetchSequence'
                  ) {
                    throw new TypeError('sequence unavailable')
                  }
                  return Reflect.get(target, property, receiver)
                },
                getOwnPropertyDescriptor: (target, property) => {
                  if (
                    inaccessible === 'signalDescriptor' &&
                    property === 'signal'
                  ) {
                    throw new TypeError('signal descriptor unavailable')
                  }
                  return Reflect.getOwnPropertyDescriptor(target, property)
                },
              },
            )
            context.fetchFn = () => queryFn(proxyContext)
          },
        },
      }),
      'remote',
    )
  }
  assert.equal(queryFnCalls, 2)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// A retained wrapper can be called after its fetch has settled. That call may
// run the original function but must not add a source to the completed fetch.
it('retained queryFn wrapper does not attribute a settled fetch', async () => {
  const client = new QueryClient()
  const key = ['settled-retained-wrapper']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  let invokeCaptured: ((context: QueryFunctionContext) => unknown) | undefined

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn: () => 'remote',
      behavior: {
        onFetch: (context) => {
          const captured = context.options.queryFn
          assert.ok(typeof captured === 'function')
          invokeCaptured = (queryFnContext) => captured(queryFnContext)
          context.fetchFn = () => 'cached'
        },
      },
    }),
    'cached',
  )
  const start = events.find((event) => event.type === 'fetchStarted')
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(start)
  assert.ok(query)
  assert.ok(invokeCaptured)
  assert.equal(
    invokeCaptured({
      client,
      queryKey: key,
      meta: undefined,
      signal: new AbortController().signal,
      fetchSequence: start.fetchSequence,
    }),
    'remote',
  )
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  assert.equal(query.dataSourceSequence, undefined)
  stop()
  client.clear()
})

// A cache success callback runs after the result is applied but before
// Query.fetch returns. A retained wrapper called there cannot be the source
// of the result that has already been published.
it('retained queryFn wrapper is inert during success publication', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['success-callback-wrapper']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let invokeCaptured: ((context: QueryFunctionContext) => unknown) | undefined
  let callbackContext: QueryFunctionContext | undefined
  cache.config.onSuccess = (_, query) => {
    assert.ok(invokeCaptured)
    callbackContext = {
      client,
      queryKey: key,
      meta: undefined,
      signal: new AbortController().signal,
      fetchSequence: query.fetchSequence,
    }
    assert.equal(invokeCaptured(callbackContext), 'remote')
  }

  assert.equal(
    await client.query({
      queryKey: key,
      queryFn: () => 'remote',
      behavior: {
        onFetch: (context) => {
          const captured = context.options.queryFn
          assert.ok(typeof captured === 'function')
          invokeCaptured = (queryFnContext) => captured(queryFnContext)
          context.fetchFn = () => 'cached'
        },
      },
    }),
    'cached',
  )
  assert.ok(callbackContext)
  assert.equal(callbackContext.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// A behavior can fail during setup, before Query.fetch installs a retryer.
// A wrapper retained from that failed setup must not later report a source
// for a fetch that never started.
it('retained queryFn wrapper from failed behavior setup is inert', async () => {
  const client = new QueryClient()
  const key = ['failed-behavior-setup']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  let invokeCaptured: ((context: QueryFunctionContext) => unknown) | undefined
  const failure = new Error('behavior setup failed')

  await assert.rejects(
    client.query({
      queryKey: key,
      queryFn: () => 'remote',
      behavior: {
        onFetch: (context) => {
          const captured = context.options.queryFn
          assert.ok(typeof captured === 'function')
          invokeCaptured = (queryFnContext) => captured(queryFnContext)
          throw failure
        },
      },
    }),
    failure,
  )
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(query)
  assert.ok(invokeCaptured)
  const beforeLateCall = client.getQueryCache().currentSequence
  const lateContext: QueryFunctionContext = {
    client,
    queryKey: key,
    meta: undefined,
    signal: new AbortController().signal,
    fetchSequence: query.fetchSequence,
  }
  assert.equal(invokeCaptured(lateContext), 'remote')
  assert.equal(lateContext.sourceSequence, undefined)
  assert.equal(client.getQueryCache().currentSequence, beforeLateCall)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// A behavior can invoke queryFn while configuring fetchFn, before Query.fetch
// installs its retryer. The source position precedes user code and its writes;
// the one delayed source event carries the installed retryer's live promise.
it('eager custom behavior records queryFn invocation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['eager-custom-behavior']
  const response = deferred<string>()
  let functionSourceSequence: number | undefined
  let writeSequence: number | undefined
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: (context) => {
      functionSourceSequence = context.sourceSequence
      writeSequence = cache.reserveSequence()
      return response.promise
    },
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        const data = queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        context.fetchFn = () => data
      },
    },
  })
  const stopObserver = observer.subscribe(() => {})

  const pending = observer.refetch()
  const query = cache.find({ queryKey: key })
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.ok(query)
  assert.equal(starts.length, 1)
  const start = starts[0]!
  assert.equal(sources.length, 1)
  const source = sources[0]!
  assert.equal(source.fetchSequence, start.fetchSequence)
  assert.equal(source.sourceSequence, functionSourceSequence)
  assert.equal(query.sourceSequence, source.sourceSequence)
  assert.ok(writeSequence)
  assert.ok(source.sourceSequence < writeSequence)
  assert.ok(events.indexOf(start) < events.indexOf(source))
  assert.equal(source.promise, query.promise)
  assert.equal(query.state.fetchStatus, 'fetching')
  response.resolve('remote')
  assert.equal(await source.promise, 'remote')
  assert.equal((await pending).data, 'remote')
  const success = findSuccess(events, false)
  assert.ok(success)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(query.state.fetchStatus, 'idle')
  stopObserver()
  stop()
  client.clear()
})

// A source position is reserved before user queryFn runs. Reading the Query
// during an eager behavior invocation must expose the same position as its
// query-function context, even though no retryer has been installed yet.
it('eager queryFn exposes its source position during invocation', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['eager-query-source-read']
  let contextSourceSequence: number | undefined
  let querySourceSequence: number | undefined
  const query = cache.build(client, {
    queryKey: key,
    queryFn: (context) => {
      contextSourceSequence = context.sourceSequence
      querySourceSequence = query.sourceSequence
      return 'remote'
    },
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        context.fetchFn = () => Promise.resolve('remote')
      },
    },
  })

  assert.equal(await query.fetch(), 'remote')
  assert.ok(contextSourceSequence)
  assert.equal(querySourceSequence, contextSourceSequence)
  assert.equal(query.sourceSequence, contextSourceSequence)
  client.clear()
})

// A behavior may freeze its setup context before invoking queryFn. The
// optional context metadata write cannot prevent the source from running.
it('eager queryFn runs when behavior freezes its fetch context', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['frozen-eager-fetch-context']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let calls = 0
  let functionSourceSequence: number | undefined
  const query = cache.build(client, {
    queryKey: key,
    queryFn: (context) => {
      calls++
      functionSourceSequence = context.sourceSequence
      return 'remote'
    },
    behavior: {
      onFetch: (context) => {
        context.fetchFn = () => Promise.resolve('remote')
        Object.freeze(context)
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
      },
    },
  })

  assert.equal(await query.fetch(), 'remote')
  assert.equal(calls, 1)
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(sources.length, 1)
  assert.equal(sources[0]!.sourceSequence, functionSourceSequence)
  assert.equal(query.sourceSequence, functionSourceSequence)
  stop()
  client.clear()
})

// A nested fetch can reserve a later attempt while the outer behavior is
// still setting up. Query getters describe the latest reserved attempt, so
// installing the outer retryer cannot move those positions backward.
it('eager nested fetch keeps the latest Query positions', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['eager-nested-query-positions']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let nested: Promise<string> | undefined
  let nestedSourceSequence: number | undefined
  const query = cache.build(client, {
    queryKey: key,
    queryFn: () => {
      nested = query.fetch({
        queryKey: key,
        queryFn: (context) => {
          nestedSourceSequence = context.sourceSequence
          return 'inner'
        },
      })
      return 'outer'
    },
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        context.fetchFn = () => Promise.resolve('outer')
      },
    },
  })

  const outer = query.fetch()
  assert.ok(nested)
  const starts = events.filter((event) => event.type === 'fetchStarted')
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(starts.length, 2)
  assert.equal(sources.length, 2)
  const latest = Math.max(...starts.map((event) => event.fetchSequence))
  assert.equal(query.fetchSequence, latest)
  assert.equal(
    query.sourceSequence,
    sources.find((event) => event.fetchSequence === latest)?.sourceSequence,
  )
  assert.equal(query.sourceSequence, nestedSourceSequence)
  assert.deepEqual(await Promise.all([outer, nested]), ['outer', 'inner'])
  stop()
  client.clear()
})

// A behavior can invoke queryFn and then fail before a retryer is installed.
// The invocation still has a source position, and its source event settles
// with the setup failure so listeners can release dependent work.
it('eager queryFn invocation reports its source when behavior setup throws', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let invocations = 0
  let functionSourceSequence: number | undefined
  let functionSignal: AbortSignal | undefined
  const failure = new Error('behavior setup failed')

  const failedFetch = client.fetchQuery({
    queryKey: ['eager-then-throw'],
    queryFn: (context) => {
      invocations++
      functionSourceSequence = context.sourceSequence
      functionSignal = context.signal
      return 'remote'
    },
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        throw failure
      },
    },
  })
  assert.equal(
    await failedFetch.then(
      () => undefined,
      (error: unknown) => error,
    ),
    failure,
  )
  assert.equal(invocations, 1)
  assert.equal(functionSignal?.aborted, true)
  assert.equal(
    events.filter((event) => event.type === 'fetchStarted').length,
    0,
  )
  const sources = events.filter((event) => event.type === 'fetchSourceStarted')
  assert.equal(sources.length, 1)
  assert.equal(sources[0]!.sourceSequence, functionSourceSequence)
  assert.equal(
    await sources[0]!.promise.then(
      () => undefined,
      (error: unknown) => error,
    ),
    failure,
  )
  const query = cache.find({ queryKey: ['eager-then-throw'] })
  assert.ok(query)
  assert.equal(query.sourceSequence, sources[0]!.sourceSequence)
  assert.equal(query.promise, undefined)
  assert.equal(query.state.fetchStatus, 'idle')
  assert.equal(query.state.error, failure)
  stop()
  client.clear()
})

// A behavior may discard eager queryFn promises before its setup throws. The
// setup failure aborts those requests, so Query Core must observe their
// rejections before aborting while still rejecting the fetch with setup error.
it('failed behavior setup handles every abandoned eager queryFn rejection', async () => {
  const client = new QueryClient()
  const setupError = new Error('behavior setup failed')
  const providerErrors = [
    new Error('first provider aborted'),
    new Error('second provider aborted'),
  ]
  let invocations = 0

  const fetch = client.fetchQuery({
    queryKey: ['abandoned-eager-promises'],
    queryFn: ({ signal }) => {
      const error = providerErrors[invocations++]!
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(error), { once: true })
      })
    },
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        const invoke = () =>
          queryFn({
            client: context.client,
            queryKey: context.queryKey,
            meta: context.options.meta,
            signal: context.signal,
          })
        invoke()
        invoke()
        throw setupError
      },
    },
  })

  assert.equal(
    await fetch.then(
      () => undefined,
      (error: unknown) => error,
    ),
    setupError,
  )
  assert.equal(invocations, providerErrors.length)
  await new Promise((resolve) => setTimeout(resolve, 0))
  client.clear()
})

// A behavior can cancel before Query.fetch installs a retryer. Silent and
// revert cancellations preserve the prior state and do not report a fetch
// failure through QueryCache callbacks.
it.each([
  ['silent', { silent: true }],
  ['revert', { revert: true }],
] as const)(
  'behavior setup %s cancellation preserves prior state',
  async (kind, options) => {
    const callbacks: Array<string> = []
    const cache = new QueryCache({
      onError: () => callbacks.push('error'),
      onSettled: () => callbacks.push('settled'),
    })
    const client = new QueryClient({ queryCache: cache })
    const key = ['setup-cancel', kind]
    client.setQueryData(key, 'seed')
    const query = cache.find<string>({ queryKey: key })
    assert.ok(query)
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => events.push(event))

    const fetch = query.fetch({
      queryKey: key,
      queryFn: () => 'remote',
      behavior: {
        onFetch: () => {
          throw new CancelledError(options)
        },
      },
    })
    if (kind === 'revert') {
      assert.equal(await fetch, 'seed')
    } else {
      await assert.rejects(fetch, CancelledError)
    }

    assert.equal(query.state.data, 'seed')
    assert.equal(query.state.status, 'success')
    assert.equal(query.state.fetchStatus, 'idle')
    assert.equal(query.state.error, null)
    assert.deepEqual(callbacks, [])
    assert.equal(
      events.some(
        (event) => event.type === 'updated' && event.action.type === 'error',
      ),
      false,
    )
    stop()
    client.clear()
  },
)

// Replacing an active fetch cancels its retryer before the new behavior runs.
// If setup then cancels, no retryer remains to settle the fetching state.
// Revert returns the restored data under Query.fetch's promise contract.
it.each(['silent', 'revert'] as const)(
  'behavior setup %s cancellation settles an active fetch replacement',
  async (kind) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const cache = client.getQueryCache()
    const key = ['replacement-setup-cancel', kind]
    client.setQueryData(key, 'seed')
    const query = cache.find<string>({ queryKey: key })
    assert.ok(query)
    const first = query.fetch({
      queryKey: key,
      queryFn: () => new Promise<string>(() => {}),
    })
    const firstSettled = first.catch(() => {})
    assert.equal(query.state.fetchStatus, 'fetching')

    const replacement = query.fetch(
      {
        queryKey: key,
        queryFn: () => 'new',
        behavior: {
          onFetch: () => {
            throw new CancelledError({
              silent: kind === 'silent',
              revert: kind === 'revert',
            })
          },
        },
      },
      { cancelRefetch: true },
    )

    if (kind === 'revert') {
      assert.equal(await replacement, 'seed')
    } else {
      await assert.rejects(replacement, CancelledError)
    }
    await firstSettled
    assert.equal(query.state.fetchStatus, 'idle')
    assert.equal(query.state.data, 'seed')
    assert.equal(query.state.status, 'success')
    client.clear()
  },
)

// Silent cancellation makes the old fetch follow the attempt that caused it.
// A setup failure belongs to that direct replacement even though it never
// installs a retryer.
it('silently cancelled fetch adopts its replacement setup failure', async () => {
  const client = new QueryClient()
  const key = ['replacement-setup-failure-adoption']
  const failure = new Error('replacement setup failed')
  client.setQueryData(key, 'seed')
  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const first = query.fetch({
    queryKey: key,
    queryFn: () => new Promise<string>(() => {}),
  })
  const replacement = query.fetch(
    {
      queryKey: key,
      queryFn: () => 'unused',
      behavior: {
        onFetch: () => {
          throw failure
        },
      },
    },
    { cancelRefetch: true },
  )

  await assert.rejects(replacement, (error) => error === failure)
  await assert.rejects(first, (error) => error === failure)
  client.clear()
})

// Reentry can start a third fetch during the replacement's setup. The first
// promise still follows the attempt that directly cancelled it.
it('silently cancelled fetch follows its direct replacement through nested setup', async () => {
  const client = new QueryClient()
  const key = ['nested-replacement-adoption']
  const failure = new Error('direct replacement failed')
  client.setQueryData(key, 'seed')
  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const first = query.fetch({
    queryKey: key,
    queryFn: () => new Promise<string>(() => {}),
  })
  let nested!: Promise<string>
  const replacement = query.fetch(
    {
      queryKey: key,
      queryFn: () => 'unused',
      behavior: {
        onFetch: () => {
          nested = query.fetch(
            { queryKey: key, queryFn: () => 'nested' },
            { cancelRefetch: true },
          )
          throw failure
        },
      },
    },
    { cancelRefetch: true },
  )

  await assert.rejects(replacement, (error) => error === failure)
  assert.equal(await nested, 'nested')
  await assert.rejects(first, (error) => error === failure)
  assert.equal(query.state.data, 'nested')
  client.clear()
})

// resetQueries cancels the old retryer and starts a new fetch on the same
// Query. Its silent cancellation follows that new fetch even though the
// replacement came from reset rather than fetch({ cancelRefetch: true }).
it('silent reset cancellation follows the subsequent same-Query refetch', async () => {
  const client = new QueryClient()
  const key = ['reset-silent-refetch']
  let calls = 0
  const observer = new QueryObserver(client, {
    queryKey: key,
    initialData: 'seed',
    staleTime: Infinity,
    queryFn: () =>
      ++calls === 1 ? new Promise<string>(() => {}) : 'after-reset',
  })
  const stop = observer.subscribe(() => {})
  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const first = query.fetch()
  const firstOutcome = first.then(
    (value) => value,
    (error: unknown) => error,
  )
  const reset = client.resetQueries({ queryKey: key })

  await reset
  assert.equal(await firstOutcome, 'after-reset')
  assert.equal(query.state.data, 'after-reset')
  assert.equal(calls, 2)
  stop()
  client.clear()
})

// A reset-triggered replacement can fail in behavior setup before it installs
// a retryer. The cancelled fetch still follows that replacement's promise.
it('silent reset cancellation follows a replacement setup failure', async () => {
  const client = new QueryClient()
  const key = ['reset-silent-setup-failure']
  const failure = new Error('replacement setup failed')
  let setups = 0
  const observer = new QueryObserver(client, {
    queryKey: key,
    initialData: 'seed',
    staleTime: Infinity,
    retry: false,
    queryFn: () => new Promise<string>(() => {}),
    behavior: {
      onFetch: () => {
        if (++setups === 2) throw failure
      },
    },
  })
  const stop = observer.subscribe(() => {})
  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const first = query.fetch()
  const firstOutcome = first.then(
    (value) => value,
    (error: unknown) => error,
  )

  await client.resetQueries({ queryKey: key })
  assert.equal(await firstOutcome, failure)
  assert.equal(setups, 2)
  stop()
  client.clear()
})

// The old fetch follows the replacement's full result, including validation
// that rejects undefined data after the replacement retryer resolves.
it('silent reset cancellation follows replacement result validation', async () => {
  const client = new QueryClient()
  const key = ['reset-silent-invalid-result']
  let calls = 0
  const observer = new QueryObserver(client, {
    queryKey: key,
    initialData: 'seed',
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      ++calls === 1
        ? new Promise<string>(() => {})
        : (undefined as unknown as string),
  })
  const stop = observer.subscribe(() => {})
  const query = client.getQueryCache().find<string>({ queryKey: key })
  assert.ok(query)
  const first = query.fetch()
  const firstOutcome = first.then(
    (value) => value,
    (error: unknown) => error,
  )

  await client.resetQueries({ queryKey: key })
  const outcome = await firstOutcome
  assert.ok(outcome instanceof Error)
  assert.match(outcome.message, /data is undefined/)
  assert.equal(calls, 2)
  stop()
  client.clear()
})

// Query.fetch is a Promise API even when a cache listener throws while an
// active fetch is being cancelled for replacement.
it('replacement cancellation listener failure rejects observer.refetch asynchronously', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['replacement-listener-throw']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const pending = query.fetch({
    queryKey: key,
    queryFn: () => new Promise<string>(() => {}),
  })
  void pending.catch(() => {})
  const observer = new QueryObserver(client, {
    queryKey: key,
    queryFn: () => 'replacement',
    enabled: false,
  })
  const stopObserver = observer.subscribe(() => {})
  const failure = new Error('subscriber failed')
  const stopCache = cache.subscribe((event) => {
    if (event.type === 'fetchCancelled' && event.query === query) throw failure
  })
  let result: Promise<unknown> | undefined

  assert.doesNotThrow(() => {
    result = observer.refetch({ throwOnError: true })
  })
  await assert.rejects(result!, (error) => error === failure)
  stopCache()
  stopObserver()
  client.clear()
})

// Without a silent or revert instruction, CancelledError follows the same
// failure path as it does after the retryer starts.
it('unmarked behavior setup cancellation reports a terminal error', async () => {
  const callbacks: Array<string> = []
  const cache = new QueryCache({
    onError: () => callbacks.push('error'),
    onSettled: () => callbacks.push('settled'),
  })
  const client = new QueryClient({ queryCache: cache })
  const failure = new CancelledError()
  const key = ['unmarked-setup-cancel']

  await assert.rejects(
    client.fetchQuery({
      queryKey: key,
      queryFn: () => 'remote',
      behavior: {
        onFetch: () => {
          throw failure
        },
      },
    }),
    CancelledError,
  )

  const query = cache.find({ queryKey: key })
  assert.ok(query)
  assert.equal(query.state.status, 'error')
  assert.equal(query.state.error, failure)
  assert.deepEqual(callbacks, ['error', 'settled'])
  client.clear()
})

// A behavior can reject setup before queryFn runs. There is no source or
// installed fetch, but observers still need a terminal error result.
it('behavior setup failure without a source reaches observers', async () => {
  const callbacks: Array<{
    kind: 'error' | 'settled'
    error: unknown
    data?: unknown
    query: unknown
  }> = []
  const cache = new QueryCache({
    onError: (error, query) => callbacks.push({ kind: 'error', error, query }),
    onSettled: (data, error, query) =>
      callbacks.push({ kind: 'settled', data, error, query }),
  })
  const client = new QueryClient({ queryCache: cache })
  const key = ['behavior-setup-failure-without-source']
  const failure = new Error('behavior setup failed before source')
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => 'remote',
    behavior: {
      onFetch: () => {
        throw failure
      },
    },
  })
  const results: Array<ReturnType<typeof observer.getCurrentResult>> = []
  const stopObserver = observer.subscribe((result) => results.push(result))

  const result = await observer.refetch()
  const query = cache.find({ queryKey: key })
  assert.ok(query)
  assert.equal(result.error, failure)
  assert.equal(result.fetchStatus, 'idle')
  assert.equal(result.status, 'error')
  assert.ok(results.some((observed) => observed.error === failure))
  assert.equal(query.state.fetchStatus, 'idle')
  assert.equal(query.state.error, failure)
  assert.equal(
    events.filter((event) => event.type === 'fetchStarted').length,
    0,
  )
  assert.equal(
    events.filter((event) => event.type === 'fetchSourceStarted').length,
    0,
  )
  const errors = events.filter(
    (event): event is ErrorEvent =>
      event.type === 'updated' && event.action.type === 'error',
  )
  assert.equal(errors.length, 1)
  assert.equal(errors[0]!.action.error, failure)
  assert.ok(query.fetchSequence)
  assert.equal(errors[0]!.fetchSequence, query.fetchSequence)
  assert.equal(errors[0]!.sourceSequence, undefined)
  assert.deepEqual(
    callbacks.map((callback) => callback.kind),
    ['error', 'settled'],
  )
  assert.ok(callbacks.every((callback) => callback.error === failure))
  assert.ok(callbacks.every((callback) => callback.query === query))
  assert.equal(callbacks[1]!.data, undefined)
  stopObserver()
  stop()
  client.clear()
})

// A failed replacement follows a cancelled active fetch. Its setup error
// must finish the Query's fetching state with or without a source invocation.
it.each(['before', 'after'] as const)(
  'behavior setup failure %s source settles a cancelled fetch replacement',
  async (sourcePhase) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const cache = client.getQueryCache()
    const key = ['behavior-setup-failure-replacement']
    client.setQueryData(key, 'seed')
    const query = cache.find<string>({ queryKey: key })
    assert.ok(query)
    const observer = new QueryObserver(client, {
      queryKey: key,
      enabled: false,
      queryFn: () => 'remote',
    })
    const results: Array<ReturnType<typeof observer.getCurrentResult>> = []
    const stopObserver = observer.subscribe((result) => results.push(result))
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => events.push(event))
    const pending = query.fetch({
      queryKey: key,
      queryFn: () => new Promise<string>(() => {}),
    })
    assert.equal(query.state.fetchStatus, 'fetching')
    const failure = new Error('replacement setup failed')
    const replacement = query.fetch(
      {
        queryKey: key,
        queryFn: () => 'replacement',
        behavior: {
          onFetch: (context) => {
            if (sourcePhase === 'after') {
              const queryFn = context.options.queryFn
              assert.ok(typeof queryFn === 'function')
              queryFn({
                client: context.client,
                queryKey: context.queryKey,
                meta: context.options.meta,
                signal: context.signal,
              })
            }
            throw failure
          },
        },
      },
      { cancelRefetch: true },
    )

    assert.equal(
      await replacement.then(
        () => undefined,
        (error: unknown) => error,
      ),
      failure,
    )
    await pending.catch(() => {})
    assert.equal(query.state.fetchStatus, 'idle')
    assert.equal(query.state.error, failure)
    assert.equal(observer.getCurrentResult().error, failure)
    assert.ok(results.some((result) => result.error === failure))
    const replacementSequence = query.fetchSequence
    const sources = events.filter(
      (event): event is SourceEvent =>
        event.type === 'fetchSourceStarted' &&
        event.fetchSequence === replacementSequence,
    )
    assert.equal(sources.length, sourcePhase === 'after' ? 1 : 0)
    if (sourcePhase === 'after') {
      assert.equal(
        await sources[0]!.promise.then(
          () => undefined,
          (error: unknown) => error,
        ),
        failure,
      )
    }
    assert.equal(
      events.filter(
        (event) =>
          event.type === 'fetchStarted' &&
          event.fetchSequence === replacementSequence,
      ).length,
      0,
    )
    const errors = events.filter(
      (event): event is ErrorEvent =>
        event.type === 'updated' &&
        event.action.type === 'error' &&
        event.fetchSequence === replacementSequence,
    )
    assert.equal(errors.length, 1)
    assert.equal(errors[0]!.action.error, failure)
    assert.equal(
      errors[0]!.sourceSequence,
      sourcePhase === 'after' ? sources[0]!.sourceSequence : undefined,
    )
    stopObserver()
    stop()
    client.clear()
  },
)

// Aborting a failed setup can synchronously start another fetch on the same
// Query. The earlier source event keeps its own positions and rejected promise
// even when the later fetch installs a retryer before that event is delivered.
it('eager setup failure keeps source attribution through abort reentry', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['eager-throw-abort-reentry']
  const failure = new Error('outer setup failed')
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let outerFetchSequence: number | undefined
  let outerSourceSequence: number | undefined
  let innerSourceSequence: number | undefined
  let nested: Promise<unknown> | undefined
  let signal: AbortSignal | undefined
  const query = cache.build(client, {
    queryKey: key,
    queryFn: (context) => {
      outerSourceSequence = context.sourceSequence
      return 'outer'
    },
    behavior: {
      onFetch: (context, currentQuery) => {
        outerFetchSequence = context.fetchSequence
        signal = context.signal
        signal.addEventListener(
          'abort',
          () => {
            nested = currentQuery.fetch({
              queryKey: key,
              queryFn: (innerContext) => {
                innerSourceSequence = innerContext.sourceSequence
                return 'inner'
              },
            })
          },
          { once: true },
        )
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal,
        })
        throw failure
      },
    },
  })

  assert.equal(
    await query.fetch().then(
      () => undefined,
      (error: unknown) => error,
    ),
    failure,
  )
  assert.equal(signal?.aborted, true)
  assert.ok(nested)
  assert.equal(await nested, 'inner')
  const sources = events.filter(
    (event): event is SourceEvent => event.type === 'fetchSourceStarted',
  )
  assert.equal(sources.length, 2)
  const outerSource = sources.find(
    (event) => event.fetchSequence === outerFetchSequence,
  )
  const innerSource = sources.find(
    (event) => event.fetchSequence !== outerFetchSequence,
  )
  const starts = events.filter((event) => event.type === 'fetchStarted')
  assert.ok(outerSource)
  assert.ok(innerSource)
  assert.equal(starts.length, 1)
  assert.equal(starts[0]!.fetchSequence, innerSource.fetchSequence)
  assert.equal(outerSource.sourceSequence, outerSourceSequence)
  assert.equal(innerSource.sourceSequence, innerSourceSequence)
  assert.ok(outerSource.sourceSequence < innerSource.sourceSequence)
  assert.ok(events.indexOf(innerSource) < events.indexOf(outerSource))
  assert.equal(query.fetchSequence, innerSource.fetchSequence)
  assert.equal(query.sourceSequence, innerSource.sourceSequence)
  assert.equal(
    events.filter(
      (event) =>
        event.type === 'updated' &&
        event.action.type === 'error' &&
        event.fetchSequence === outerFetchSequence,
    ).length,
    0,
  )
  assert.equal(
    await outerSource.promise.then(
      () => undefined,
      (error: unknown) => error,
    ),
    failure,
  )
  assert.equal(await innerSource.promise, 'inner')
  stop()
  client.clear()
})

// Invalidation only marks cached data stale, so a failed setup still reports
// its error. Reset replaces the Query state and supersedes the setup failure,
// even when a later invalidation obscures the final state shape.
it.each([
  ['abort', 'reset', 'eager'],
  ['source event', 'reset', 'eager'],
  ['abort', 'invalidate', 'eager'],
  ['source event', 'invalidate', 'eager'],
  ['abort', 'reset then invalidate', 'eager'],
  ['source event', 'reset then invalidate', 'eager'],
  ['abort', 'reset', 'none'],
  ['abort', 'invalidate', 'none'],
] as const)(
  '%s during failed setup applies %s with %s source',
  async (actionAt, action, sourceKind) => {
    const client = new QueryClient()
    const cache = client.getQueryCache()
    const key = ['setup-failure-reentry', actionAt, action, sourceKind]
    const failure = new Error('setup failed')
    const events: Array<QueryCacheNotifyEvent> = []
    const applyAction = () => {
      if (action !== 'invalidate') query.reset()
      if (action !== 'reset') query.invalidate()
    }
    const query = cache.build(client, {
      queryKey: key,
      queryFn: () => 'source',
      behavior: {
        onFetch: (context) => {
          if (actionAt === 'abort') {
            context.signal.addEventListener('abort', applyAction, {
              once: true,
            })
          }
          if (sourceKind === 'eager') {
            const queryFn = context.options.queryFn
            assert.ok(typeof queryFn === 'function')
            queryFn({
              client: context.client,
              queryKey: context.queryKey,
              meta: context.options.meta,
              signal: context.signal,
            })
          }
          throw failure
        },
      },
    })
    const stop = cache.subscribe((event) => {
      events.push(event)
      if (
        actionAt === 'source event' &&
        event.type === 'fetchSourceStarted' &&
        event.query === query
      ) {
        applyAction()
      }
    })

    assert.equal(
      await query.fetch().then(
        () => undefined,
        (error: unknown) => error,
      ),
      failure,
    )
    assert.equal(
      events.filter((event) => event.type === 'fetchSourceStarted').length,
      sourceKind === 'eager' ? 1 : 0,
    )
    const wasReset = action !== 'invalidate'
    assert.equal(query.state.status, wasReset ? 'pending' : 'error')
    assert.equal(query.state.fetchStatus, 'idle')
    assert.equal(query.state.error, wasReset ? null : failure)
    assert.equal(query.state.isInvalidated, action !== 'reset')
    const actions = events
      .filter((event) => event.type === 'updated')
      .map((event) => event.action.type)
    assert.equal(
      actions.at(-1),
      wasReset ? (action === 'reset' ? 'setState' : 'invalidate') : 'error',
    )
    stop()
    client.clear()
  },
)

// A state snapshot can change cached data during a fetch. A later failure
// retains that data and settles the fetch as an installed retryer would.
it('state snapshot write during failed setup retains data and reports the error', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['setup-failure-state-write']
  const failure = new Error('setup failed')
  const query = cache.build(client, {
    queryKey: key,
    queryFn: () => 'source',
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        throw failure
      },
    },
  })
  const stop = cache.subscribe((event) => {
    if (event.type === 'fetchSourceStarted' && event.query === query) {
      query.setState({
        data: 'manual',
        status: 'success',
        fetchStatus: 'fetching',
      })
    }
  })

  await assert.rejects(query.fetch(), (error) => error === failure)
  assert.equal(query.state.data, 'manual')
  assert.equal(query.state.status, 'error')
  assert.equal(query.state.fetchStatus, 'idle')
  assert.equal(query.state.error, failure)
  stop()
  client.clear()
})

// A manual cache write during an active fetch keeps its data when the fetch
// fails. The failed replacement must still settle the fetching state and
// report its error, just as an installed fetch does after a manual write.
it.each(['onFetch', 'source event'] as const)(
  'manual cache write from %s during failed replacement setup retains data and settles the fetch',
  async (writeAt) => {
    const callbacks: Array<string> = []
    const cache = new QueryCache({
      onError: () => callbacks.push('error'),
      onSettled: () => callbacks.push('settled'),
    })
    const client = new QueryClient({ queryCache: cache })
    const key = ['setup-failure-manual-write', writeAt]
    const failure = new Error('replacement setup failed')
    client.setQueryData(key, 'seed')
    const query = cache.find<string>({ queryKey: key })
    assert.ok(query)
    const first = query.fetch({
      queryKey: key,
      queryFn: () => new Promise<string>(() => {}),
    })
    const firstSettled = first.catch(() => {})
    const stop = cache.subscribe((event) => {
      if (
        writeAt === 'source event' &&
        event.type === 'fetchSourceStarted' &&
        event.query === query
      ) {
        client.setQueryData(key, 'manual')
      }
    })

    const replacement = query.fetch(
      {
        queryKey: key,
        queryFn: () => 'unused',
        behavior: {
          onFetch: (context) => {
            if (writeAt === 'onFetch') {
              client.setQueryData(key, 'manual')
            } else {
              const queryFn = context.options.queryFn
              assert.ok(typeof queryFn === 'function')
              queryFn({
                client: context.client,
                queryKey: context.queryKey,
                meta: context.options.meta,
                signal: context.signal,
              })
            }
            throw failure
          },
        },
      },
      { cancelRefetch: true },
    )

    await assert.rejects(replacement, (error) => error === failure)
    await firstSettled
    assert.equal(query.state.data, 'manual')
    assert.equal(query.state.error, failure)
    assert.equal(query.state.status, 'error')
    assert.equal(query.state.fetchStatus, 'idle')
    assert.equal(query.promise, undefined)
    assert.deepEqual(callbacks, ['error', 'settled'])
    stop()
    client.clear()
  },
)

// A patch to unrelated state does not retire an active fetch. Its setup
// failure still reports a terminal error while preserving the patch.
it('partial state patch during failed setup does not suppress the error', async () => {
  const client = new QueryClient()
  const failure = new Error('setup failed')
  const query = client.getQueryCache().build(client, {
    queryKey: ['setup-failure-partial-patch'],
    queryFn: () => 'unused',
    behavior: {
      onFetch: () => {
        query.setState({ isInvalidated: true })
        throw failure
      },
    },
  })

  await assert.rejects(query.fetch(), (error) => error === failure)
  assert.equal(query.state.isInvalidated, true)
  assert.equal(query.state.status, 'error')
  assert.equal(query.state.error, failure)
  assert.equal(query.state.fetchStatus, 'idle')
  client.clear()
})

// Removing a Query from its cache during the source notification retires the
// object. A setup failure cannot publish a later state update on that object.
it('removed Query gets no terminal update after failed setup source event', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['setup-failure-remove']
  const failure = new Error('setup failed')
  const events: Array<QueryCacheNotifyEvent> = []
  const query = cache.build(client, {
    queryKey: key,
    queryFn: () => 'source',
    behavior: {
      onFetch: (context) => {
        const queryFn = context.options.queryFn
        assert.ok(typeof queryFn === 'function')
        queryFn({
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        })
        throw failure
      },
    },
  })
  const stop = cache.subscribe((event) => {
    events.push(event)
    if (event.type === 'fetchSourceStarted' && event.query === query) {
      cache.remove(query)
    }
  })

  assert.equal(
    await query.fetch().then(
      () => undefined,
      (error: unknown) => error,
    ),
    failure,
  )
  assert.equal(cache.get(query.queryHash), undefined)
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const removed = events.find((event) => event.type === 'removed')
  assert.ok(source)
  assert.ok(removed)
  assert.ok(events.indexOf(source) < events.indexOf(removed))
  assert.equal(
    events.filter(
      (event) => event.type === 'updated' && event.action.type === 'error',
    ).length,
    0,
  )
  stop()
  client.clear()
})

// Behavior setup and fetchStarted both run before a retryer is installed.
// Reset or removal at either boundary retires that attempt. An eager source
// already invoked by the behavior remains observable and rejects as cancelled.
it.each(['reset', 'remove'] as const)(
  '%s during option initial-data publication retires the fetch before behavior setup',
  async (action) => {
    const client = new QueryClient()
    const cache = client.getQueryCache()
    const key = ['retire-during-options', action]
    const query = cache.build(client, {
      queryKey: key,
      queryFn: () => 'unused',
    })
    let setups = 0
    let calls = 0
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => {
      events.push(event)
      if (
        event.type === 'updated' &&
        event.query === query &&
        event.action.type === 'setState' &&
        event.state.data === 'seed'
      ) {
        if (action === 'reset') query.reset()
        else cache.remove(query)
      }
    })

    await assert.rejects(
      query.fetch({
        queryKey: key,
        initialData: 'seed',
        queryFn: () => {
          calls++
          return 'remote'
        },
        behavior: { onFetch: () => setups++ },
      }),
      CancelledError,
    )
    assert.equal(setups, 0)
    assert.equal(calls, 0)
    assert.equal(
      cache.get(query.queryHash),
      action === 'reset' ? query : undefined,
    )
    assert.equal(
      events.filter((event) => event.type === 'fetchStarted').length,
      0,
    )
    assert.equal(
      events.filter((event) => event.type === 'fetchCancelled').length,
      1,
    )
    stop()
    client.clear()
  },
)

it.each(
  (['onFetch', 'fetchStarted'] as const).flatMap((phase) =>
    (['reset', 'remove'] as const).flatMap((action) =>
      (['absent', 'eager'] as const).map(
        (source) => [phase, action, source] as const,
      ),
    ),
  ),
)(
  '%s %s retires an uninstalled fetch with %s source',
  async (phase, action, source) => {
    const client = new QueryClient()
    const cache = client.getQueryCache()
    const key = ['retire-before-retryer', phase, action, source]
    client.setQueryData(key, 'seed')
    const query = cache.find<string>({ queryKey: key })
    assert.ok(query)
    let calls = 0
    let fetchSequence: number | undefined
    let signal: AbortSignal | undefined
    const events: Array<QueryCacheNotifyEvent> = []
    const stop = cache.subscribe((event) => {
      events.push(event)
      if (
        phase === 'fetchStarted' &&
        event.type === 'fetchStarted' &&
        event.query === query
      ) {
        if (action === 'reset') query.reset()
        else cache.remove(query)
      }
    })

    await assert.rejects(
      query.fetch({
        queryKey: key,
        queryFn: () => {
          calls++
          return Promise.resolve('remote')
        },
        behavior: {
          onFetch: (context) => {
            fetchSequence = context.fetchSequence
            signal = context.signal
            if (source === 'eager') void context.fetchFn()
            if (phase === 'onFetch') {
              if (action === 'reset') query.reset()
              else cache.remove(query)
            }
          },
        },
      }),
      CancelledError,
    )
    const starts = events.filter(
      (event) => event.type === 'fetchStarted' && event.query === query,
    )
    const sources = events.filter(
      (event): event is SourceEvent =>
        event.type === 'fetchSourceStarted' && event.query === query,
    )
    const cancelled = events.find(
      (
        event,
      ): event is Extract<QueryCacheNotifyEvent, { type: 'fetchCancelled' }> =>
        event.type === 'fetchCancelled' && event.query === query,
    )
    assert.equal(starts.length, phase === 'fetchStarted' ? 1 : 0)
    assert.equal(sources.length, source === 'eager' ? 1 : 0)
    assert.ok(cancelled)
    assert.equal(cancelled.fetchSequence, fetchSequence)
    assert.equal(cancelled.sourceSequence, sources[0]?.sourceSequence)
    assert.equal(signal?.aborted, true)
    if (sources[0]) {
      assert.equal(sources[0].fetchSequence, fetchSequence)
      await assert.rejects(sources[0].promise, CancelledError)
    }
    assert.equal(calls, source === 'eager' ? 1 : 0)
    assert.equal(query.state.data, action === 'reset' ? undefined : 'seed')
    assert.equal(
      cache.get(query.queryHash),
      action === 'reset' ? query : undefined,
    )
    assert.equal(
      events.filter(
        (event) =>
          event.type === 'updated' &&
          event.action.type === 'success' &&
          event.fetchSequence === fetchSequence,
      ).length,
      0,
    )
    stop()
    client.clear()
  },
)

// Removal frees the key and announces the old Query before cancellation can
// start a replacement. Consumers that replay events by key then see the old
// removal before the replacement's addition.
it('fetchCancelled reentry during removal retains the replacement Query', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['remove-cancel-reentry']
  client.setQueryData(key, 'seed')
  const oldQuery = cache.find<string>({ queryKey: key })
  assert.ok(oldQuery)
  const oldFetch = oldQuery.fetch({
    queryKey: key,
    queryFn: () => new Promise<string>(() => {}),
  })
  const oldSettled = oldFetch.catch(() => {})
  let replacement: Promise<string> | undefined
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => {
    events.push(event)
    if (event.type === 'fetchCancelled' && event.query === oldQuery) {
      replacement = client.fetchQuery({
        queryKey: key,
        queryFn: () => 'new',
      })
    }
  })

  cache.remove(oldQuery)
  assert.ok(replacement)
  assert.equal(await replacement, 'new')
  await oldSettled
  const newQuery = cache.find<string>({ queryKey: key })
  assert.ok(newQuery)
  assert.notEqual(newQuery, oldQuery)
  assert.equal(newQuery.state.data, 'new')
  const removedIndex = events.findIndex(
    (event) => event.type === 'removed' && event.query === oldQuery,
  )
  const addedIndex = events.findIndex(
    (event) => event.type === 'added' && event.query === newQuery,
  )
  assert.ok(removedIndex >= 0 && addedIndex > removedIndex)
  stop()
  client.clear()
})

// A removal listener can throw while the cache announces removal. The old
// Query still has to be destroyed so its transport is not left running.
it('removed listener failure still aborts the removed Query', () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['removed-listener-failure']
  const failure = new Error('subscriber failed')
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  let signal: AbortSignal | undefined
  const fetch = query.fetch({
    queryKey: key,
    queryFn: (context) => {
      signal = context.signal
      return new Promise<string>(() => {})
    },
  })
  void fetch.catch(() => {})
  assert.ok(signal)
  assert.equal(signal.aborted, false)
  const stop = cache.subscribe((event) => {
    if (event.type === 'removed' && event.query === query) throw failure
  })

  assert.throws(
    () => cache.remove(query),
    (error) => error === failure,
  )
  assert.equal(cache.get(query.queryHash), undefined)
  assert.equal(signal.aborted, true)
  stop()
  client.clear()
})

// A persister can defer invocation until after the Query's options change.
// The captured function's invocation remains observable even when the
// persister controls which value wins.
it('deferred persister records invocation after options change', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['deferred-persister']
  client.setQueryData(key, 'seed')
  const query = cache.find<string>({ queryKey: key })
  assert.ok(query)
  const release = deferred<boolean>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  const pending = query.fetch({
    queryKey: key,
    queryFn: () => 'remote',
    persister: async (queryFn, context) => {
      await release.promise
      return queryFn(context)
    },
  })
  const start = events.find((event) => event.type === 'fetchStarted')
  assert.ok(start)
  query.setOptions({ queryKey: key })
  release.resolve(true)
  assert.equal(await pending, 'remote')
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  assert.ok(source)
  assert.ok(success)
  assert.equal(source.fetchSequence, start.fetchSequence)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(query.dataSourceSequence, undefined)
  stop()
  client.clear()
})

// A persister cache hit can satisfy an accepted fetch without invoking the
// provided query function. The result has no tracked source position.
it('persister cache hit has no source invocation position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['persister-cache-hit']
  let queryFnCalls = 0
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))

  assert.equal(
    await client.fetchQuery({
      queryKey: key,
      queryFn: () => {
        queryFnCalls++
        return 'remote'
      },
      persister: () => 'cached',
    }),
    'cached',
  )
  const start = events.find((event) => event.type === 'fetchStarted')
  const success = findSuccess(events, false)
  const query = cache.find<string>({ queryKey: key })
  assert.ok(start)
  assert.ok(success)
  assert.ok(query)
  assert.equal(queryFnCalls, 0)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(query.dataSourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// A persister may retain its supplied query function while returning a cached
// value. Calling that function after settlement runs it outside the fetch, so
// it cannot create a late source position for the completed operation.
it('retained persister queryFn is inert after fetch settlement', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['retained-persister-queryFn']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let invokeRetained:
    | ((context: QueryFunctionContext<typeof key>) => unknown)
    | undefined
  let retainedContext: QueryFunctionContext<typeof key> | undefined

  assert.equal(
    await client.query({
      queryKey: key,
      queryFn: () => 'remote',
      persister: (queryFn, context) => {
        invokeRetained = (laterContext) => queryFn(laterContext)
        retainedContext = context
        return 'cached'
      },
    }),
    'cached',
  )
  assert.ok(invokeRetained)
  assert.ok(retainedContext)
  const beforeLateCall = cache.currentSequence
  assert.equal(invokeRetained(retainedContext), 'remote')
  assert.equal(cache.currentSequence, beforeLateCall)
  assert.equal(retainedContext.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  const query = cache.find({ queryKey: key })
  assert.ok(query)
  assert.equal(query.dataSourceSequence, undefined)
  stop()
  client.clear()
})

// A persister can subscribe to the installed retryer's promise before
// Query.fetch awaits it. Its continuation runs after the result is fixed but
// before Query.fetch resumes, so a retained queryFn must already be retired.
it('persister promise continuation cannot add a source after result settlement', async () => {
  const client = new QueryClient()
  const cache = client.getQueryCache()
  const key = ['persister-settlement-continuation']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let lateCall: Promise<unknown> | undefined

  assert.equal(
    await client.query({
      queryKey: key,
      queryFn: () => 'remote',
      persister: (queryFn, context, query) => {
        const installed = query.promise
        assert.ok(installed)
        lateCall = installed.then(() => queryFn(context))
        return 'cached'
      },
    }),
    'cached',
  )
  assert.ok(lateCall)
  assert.equal(await lateCall, 'remote')
  const query = cache.find({ queryKey: key })
  assert.ok(query)
  assert.equal(query.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// The same retirement boundary applies when the persister rejects. Its error
// continuation can call the retained function before Query.fetch catches it.
it('persister error continuation cannot add a source after rejection', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const cache = client.getQueryCache()
  const key = ['persister-error-continuation']
  const failure = new Error('persister failure')
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = cache.subscribe((event) => events.push(event))
  let lateCall: Promise<unknown> | undefined

  await assert.rejects(
    client.query({
      queryKey: key,
      queryFn: () => 'remote',
      persister: (queryFn, context, query) => {
        const installed = query.promise
        assert.ok(installed)
        lateCall = installed.catch(() => queryFn(context))
        return Promise.reject(failure)
      },
    }),
    failure,
  )
  assert.ok(lateCall)
  assert.equal(await lateCall, 'remote')
  const query = cache.find({ queryKey: key })
  assert.ok(query)
  assert.equal(query.sourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stop()
  client.clear()
})

// A persister may start the supplied query function but choose another value.
// The invocation is observable, while the winning cached value has no proven
// source invocation.
it('persister speculative query function does not own cached data', async () => {
  const client = new QueryClient()
  const remote = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const key = ['speculative-persister']
  assert.equal(
    await client.query({
      queryKey: key,
      queryFn: () => remote.promise,
      persister: (queryFn, context) =>
        Promise.race([queryFn(context), Promise.resolve('cached')]),
    }),
    'cached',
  )
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(source)
  assert.ok(success)
  assert.ok(query)
  assert.equal(success.fetchSequence, source.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(query.dataFetchSequence, success.fetchSequence)
  assert.equal(query.dataSourceSequence, undefined)
  remote.resolve('remote')
  stop()
  client.clear()
})

// A custom behavior can replace fetchFn and ignore its default result. A
// query-function invocation then remains activity, not provenance for data.
it('custom behavior speculative query function does not own cached data', async () => {
  const client = new QueryClient()
  const remote = deferred<string>()
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const key = ['speculative-behavior']
  assert.equal(
    await client.query({
      queryKey: key,
      queryFn: () => remote.promise,
      behavior: {
        onFetch: (context) => {
          const fetchDefault = context.fetchFn
          context.fetchFn = () =>
            Promise.race([fetchDefault(), Promise.resolve('cached')])
        },
      },
    }),
    'cached',
  )
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  const query = client.getQueryCache().find({ queryKey: key })
  assert.ok(source)
  assert.ok(success)
  assert.ok(query)
  assert.equal(success.fetchSequence, source.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(query.dataFetchSequence, success.fetchSequence)
  assert.equal(query.dataSourceSequence, undefined)
  remote.resolve('remote')
  stop()
  client.clear()
})

// A custom behavior can bypass FetchContext and invoke an external closure.
// Query Core cannot observe that invocation, so the source remains unknown.
it('external custom behavior queryFn has unknown source position', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['external-custom-behavior']
  const externalQueryFn = () => 'remote'
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: externalQueryFn,
    behavior: {
      onFetch: (context) => {
        context.fetchFn = externalQueryFn
      },
    },
  })
  const stopObserver = observer.subscribe(() => {})

  assert.equal((await observer.refetch()).data, 'remote')
  const start = events.find((event) => event.type === 'fetchStarted')
  const success = findSuccess(events, false)
  assert.ok(start)
  assert.ok(success)
  assert.equal(success.fetchSequence, start.fetchSequence)
  assert.equal(success.sourceSequence, undefined)
  assert.equal(observer.getCurrentResult().dataSourceSequence, undefined)
  assert.equal(
    events.some((event) => event.type === 'fetchSourceStarted'),
    false,
  )
  stopObserver()
  stop()
  client.clear()
})
