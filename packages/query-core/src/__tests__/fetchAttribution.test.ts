/* oxlint-disable tanstack-query/no-restricted-syntax -- fetchQuery remains a public path that must preserve attribution. */
import assert from 'node:assert/strict'
import { afterEach, it } from 'vitest'
import {
  InfiniteQueryObserver,
  QueryClient,
  QueryObserver,
  onlineManager,
} from '..'
import type { QueryCacheNotifyEvent, QueryFunctionContext } from '..'

type UpdatedEvent = Extract<QueryCacheNotifyEvent, { type: 'updated' }>
type SuccessEvent = UpdatedEvent & {
  action: Extract<UpdatedEvent['action'], { type: 'success' }>
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
  const source = events.find((event) => event.type === 'fetchSourceStarted')
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
  assert.equal(query.fetchSequence, starts[0]!.fetchSequence)
  assert.equal(query.sourceSequence, sources[1]!.sourceSequence)
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

// A behavior can invoke the exposed queryFn while configuring fetchFn, before
// Query.fetch installs its retryer. The invocation remains observable.
it('eager custom behavior records queryFn invocation', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const key = ['eager-custom-behavior']
  const events: Array<QueryCacheNotifyEvent> = []
  const stop = client.getQueryCache().subscribe((event) => events.push(event))
  const observer = new QueryObserver(client, {
    queryKey: key,
    enabled: false,
    queryFn: () => 'remote',
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

  assert.equal((await observer.refetch()).data, 'remote')
  const source = events.find((event) => event.type === 'fetchSourceStarted')
  const success = findSuccess(events, false)
  assert.ok(source)
  assert.ok(success)
  assert.equal(success.sourceSequence, undefined)
  stopObserver()
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
