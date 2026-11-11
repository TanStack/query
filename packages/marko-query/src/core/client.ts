import {
  QueryClient,
  dehydrate,
  environmentManager,
  hashKey,
  hydrate,
} from '@tanstack/query-core'
import type {
  DehydratedState,
  HydrateOptions,
  MutationKey,
} from '@tanstack/query-core'

/**
 * Marko's render-scoped `$global`. Only the keys Marko Query reads and writes
 * are typed, so Marko's own `Global` (and a Marko Run context) is assignable.
 */
export interface QueryGlobal {
  /**
   * The `$global` keys that Marko serializes to the browser: an array of keys,
   * or an object with `true` for each key.
   */
  serializedGlobals?:
    | ReadonlyArray<string>
    | Record<string, boolean | undefined>
}

/** The `$global` key that carries the dehydrated cache to the browser. */
export const DEHYDRATED_STATE_KEY = 'dehydratedQueryState'

const CLIENT_KEY = Symbol.for('@tanstack/marko-query/client')
const STATE_KEY = Symbol.for('@tanstack/marko-query/state')

interface SharedState {
  factory: () => QueryClient
  browserClient: QueryClient | undefined
  /** The factory that made {@link SharedState.browserClient}. */
  browserClientFactory: (() => QueryClient) | undefined
  hydratedStates: WeakSet<object>
  restoring: WeakMap<QueryClient, RestoringState>
  defaultFactoryWarned: boolean
  lateFactoryWarned: boolean
  /** Notified after {@link setQueryClient} replaces the page's client. */
  clientListeners: Set<() => void>
}

interface RestoringState {
  value: boolean
  listeners: Set<() => void>
}

/** The app's bundler replaces this; a browser has no `process`. */
declare const process: { env?: { NODE_ENV?: string } } | undefined

/**
 * The factory in effect before `<query-client-factory>` registers the app's.
 * @returns A `QueryClient` with the default options.
 */
const DEFAULT_FACTORY = () => new QueryClient()

// Kept on `globalThis` so that two copies of the adapter (the Marko 5 and
// Marko 6 packages in one app, or a duplicated bundle) share one client.
const shared: SharedState =
  ((globalThis as Record<symbol, unknown>)[STATE_KEY] as
    | SharedState
    | undefined) ??
  ((globalThis as Record<symbol, unknown>)[STATE_KEY] = {
    factory: DEFAULT_FACTORY,
    browserClient: undefined,
    browserClientFactory: undefined,
    hydratedStates: new WeakSet(),
    restoring: new WeakMap(),
    defaultFactoryWarned: false,
    lateFactoryWarned: false,
    clientListeners: new Set(),
  } satisfies SharedState)

type GlobalRecord = Record<PropertyKey, unknown>

/**
 * Warns when the server makes a client while the app's factory is not yet
 * registered. That state silently gives every client the default options:
 * the transform did not run, or a custom host loaded templates after the data
 * was fetched. It runs on the server only, in development only, and it does
 * not stop the render.
 */
function warnDefaultFactory(): void {
  if (
    typeof process === 'undefined' ||
    process.env?.NODE_ENV === 'production'
  ) {
    return
  }
  if (shared.factory !== DEFAULT_FACTORY || shared.defaultFactoryWarned) return
  shared.defaultFactoryWarned = true
  console.warn(
    '[marko-query] A QueryClient was created with the default factory. ' +
      'Put `<query-client-factory factory=...>` once in your root layout ' +
      'and import the factory there, or call `setQueryClientFactory` ' +
      'yourself in your server entry.',
  )
}

/**
 * Warns when the browser registers a factory after the page's client exists
 * and that client came from the default factory. The page keeps that client,
 * so the factory only applies to clients created later. It runs in
 * development only and does not stop the page.
 */
function warnLateBrowserFactory(): void {
  if (
    typeof process === 'undefined' ||
    process.env?.NODE_ENV === 'production'
  ) {
    return
  }
  if (shared.lateFactoryWarned) return
  shared.lateFactoryWarned = true
  console.warn(
    '[marko-query] <query-client-factory> registered after the page client ' +
      'was created with the default factory. The page keeps that client; the ' +
      'factory applies to clients created later. Put the tag once, in your ' +
      'root layout.',
  )
}

/**
 * Adds `key` to `serializedGlobals`, so that Marko sends it to the browser.
 * @param global - The render's `$global`.
 * @param key - The key to serialize.
 */
function serializeGlobal(global: GlobalRecord, key: string): void {
  const current = global.serializedGlobals as QueryGlobal['serializedGlobals']
  if (Array.isArray(current)) {
    if (!current.includes(key)) global.serializedGlobals = [...current, key]
  } else if (!(current as Record<string, unknown> | undefined)?.[key]) {
    global.serializedGlobals = { ...current, [key]: true }
  }
}

/**
 * Stores `client` as the request's client and exposes its cache to Marko's
 * serializer. The dehydrated state is a getter, so it is computed when Marko
 * reads it (render start or first flush), after the handler has prefetched.
 * @param global - The render's `$global`.
 * @param client - The client of the request.
 */
function attachServerClient(global: GlobalRecord, client: QueryClient): void {
  Object.defineProperty(global, CLIENT_KEY, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: client,
  })
  Object.defineProperty(global, DEHYDRATED_STATE_KEY, {
    configurable: true,
    enumerable: true,
    get: () => dehydrate(client),
  })
  serializeGlobal(global, DEHYDRATED_STATE_KEY)
}

/** The dehydrated mutation state objects each client has already hydrated. */
const hydratedMutations = new WeakMap<QueryClient, WeakSet<object>>()

/**
 * The set of mutation state objects that `client` has hydrated.
 * @param client - The client to read.
 * @returns The set, created on first use.
 */
function mutationRegistry(client: QueryClient): WeakSet<object> {
  let seen = hydratedMutations.get(client)
  if (!seen) hydratedMutations.set(client, (seen = new WeakSet()))
  return seen
}

/**
 * Identifies a dehydrated mutation by its key and submission time, so that a
 * copy of the same mutation is recognized. Mutations without a `mutationKey`
 * have no identity: two of them can be genuinely different.
 * @param mutationKey - The mutation's key, if it has one.
 * @param submittedAt - When the mutation was submitted.
 * @returns The identity, or `undefined` when the mutation has no key.
 */
function mutationIdentity(
  mutationKey: MutationKey | undefined,
  submittedAt: number,
): string | undefined {
  return mutationKey ? `${hashKey(mutationKey)}|${submittedAt}` : undefined
}

/**
 * Hydrates `state` into `client`, skipping paused mutations the client already
 * has. Core `hydrate` dedupes queries by hash but always builds a new
 * `Mutation`, so hydrating the same state twice would add the mutation twice
 * and resume it twice.
 *
 * A mutation is skipped when its state object was hydrated before, which covers
 * the same state reaching the client through `$global` and through
 * `<hydration-boundary>`. A mutation with a `mutationKey` is also skipped when
 * the cache already holds one with the same key and `submittedAt`, which covers
 * a fresh `dehydrate` result of the same cache.
 * @param client - The client to hydrate.
 * @param state - The dehydrated state, if there is one.
 * @param options - Extra options for `hydrate`.
 */
export function hydrateOnce(
  client: QueryClient,
  state: Partial<DehydratedState> | null | undefined,
  options?: HydrateOptions,
): void {
  if (!state || typeof state !== 'object') return
  const mutations = state.mutations
  if (!mutations?.length) {
    hydrate(client, state, options)
    return
  }
  const seen = mutationRegistry(client)
  const existing = new Set<string>()
  for (const mutation of client.getMutationCache().getAll()) {
    const identity = mutationIdentity(
      mutation.options.mutationKey,
      mutation.state.submittedAt,
    )
    if (identity) existing.add(identity)
  }
  const fresh = mutations.filter((mutation) => {
    const stateObject = mutation.state as object | undefined
    if (stateObject && typeof stateObject === 'object') {
      if (seen.has(stateObject)) return false
      seen.add(stateObject)
    }
    const identity = mutationIdentity(
      mutation.mutationKey,
      mutation.state.submittedAt,
    )
    return !identity || !existing.has(identity)
  })
  hydrate(client, { ...state, mutations: fresh }, options)
}

/**
 * Hydrates `client` with the state that the server put on `$global`. Each
 * state object is hydrated once.
 * @param client - The client to hydrate.
 * @param global - The render's `$global`.
 */
function hydrateGlobal(client: QueryClient, global: GlobalRecord): void {
  const state = global[DEHYDRATED_STATE_KEY] as DehydratedState | undefined
  if (!state || typeof state !== 'object' || shared.hydratedStates.has(state)) {
    return
  }
  shared.hydratedStates.add(state)
  hydrateOnce(client, state)
}

/**
 * Makes the page's client with the registered factory, and mounts it.
 * @returns The new client.
 */
function createBrowserClient(): QueryClient {
  shared.browserClientFactory = shared.factory
  const client = shared.factory()
  client.mount()
  return client
}

/**
 * Sets the factory used for every `QueryClient` Marko Query creates: one per
 * request on the server and one per page in the browser. Call it before the
 * first client is created (typically from a module that runs in both
 * environments).
 * @param factory - Makes a new `QueryClient`.
 */
export function setQueryClientFactory(factory: () => QueryClient): void {
  shared.factory = factory
}

/** Test hook: forgets the registered factory, as if no tag had rendered. */
export function unregisterQueryClientFactory(): void {
  shared.factory = DEFAULT_FACTORY
}

/**
 * Registers the factory that {@link getQueryClient} uses. The transform of
 * `<query-client-factory>` calls it while the template's module is evaluated,
 * which precedes any route handler, render or mount, in both realms. The tag
 * also calls it from its mount hook, as a safety net for hosts that render the
 * tag without the transform.
 *
 * On the server the factory must be registered before the request's client
 * exists, or part of the page would use a client the factory did not create.
 * That is the case when the tag is not rendered first (put it in the root
 * layout), and it throws.
 *
 * In the browser a client that already exists is not an error: the page keeps
 * it, the factory applies to clients created later, and development logs a
 * warning.
 * @param factory - Makes a new `QueryClient`.
 * @param global - The render's `$global`. It is required on the server.
 * @throws {TypeError} When `factory` is not a function.
 * @throws {Error} When `global` is missing on the server, or when the server
 * already created the request's client.
 */
export function registerQueryClientFactory(
  factory: () => QueryClient,
  global?: object,
): void {
  if (typeof factory !== 'function') {
    throw new TypeError(
      '[marko-query] <query-client-factory> needs `factory`, a function returning a QueryClient.',
    )
  }
  if (shared.factory === factory) return
  const server = environmentManager.isServer()
  if (server && !global) {
    throw new Error(
      "[marko-query] registerQueryClientFactory(factory, $global): on the server pass the request's $global.",
    )
  }
  if (server) {
    if ((global as GlobalRecord)[CLIENT_KEY]) {
      throw new Error(
        '[marko-query] <query-client-factory> must render before any query tag, so a client already exists. Put it once, in your root layout.',
      )
    }
  } else if (
    shared.browserClient !== undefined &&
    shared.browserClientFactory === DEFAULT_FACTORY
  ) {
    // A host rendered the tag without the transform, so a query tag already
    // made the page's client with the default factory. Keep that client and
    // adopt `factory` for the clients created after it. When the page's client
    // came from an app factory there is nothing to report: the registration
    // ran before the first query tag.
    warnLateBrowserFactory()
  }
  shared.factory = factory
}

/**
 * Uses a specific client. On the server, `global` is required and the client
 * becomes the request's client. In the browser it replaces the page's client
 * (which is mounted, and the previous one unmounted). Passing the client the
 * page already uses is not a no-op: `global` is still hydrated into it.
 * @param client - The client to use.
 * @param global - The render's `$global`. It is required on the server.
 * @throws {Error} When `global` is missing on the server.
 */
export function setQueryClient(client: QueryClient, global?: object): void {
  if (environmentManager.isServer()) {
    if (!global) {
      throw new Error(
        '[marko-query] setQueryClient(client, $global): on the server the client belongs to a request, so pass its $global.',
      )
    }
    attachServerClient(global as GlobalRecord, client)
    return
  }
  if (shared.browserClient === client) {
    // The page already uses this client, so there is nothing to mount or
    // unmount, but `$global` may still carry state it has not hydrated.
    if (global) hydrateGlobal(client, global as GlobalRecord)
    return
  }
  shared.browserClient?.unmount()
  shared.browserClient = client
  shared.browserClientFactory = undefined
  client.mount()
  if (global) hydrateGlobal(client, global as GlobalRecord)
  for (const listener of [...shared.clientListeners]) listener()
}

/**
 * Subscribes to replacements of the page's client. `setQueryClient` notifies
 * the listeners after it swaps the client, so a mounted tag can reconnect to
 * the new one. The server has no page client, so it never notifies.
 *
 * A tag that was given its own `client` input does not follow the page's
 * client, so `followsPageClient` lets it opt out: replacing the page's client
 * must not disturb a tag that observes a client of its own.
 * @param reconnect - Called after the page's client is replaced.
 * @param followsPageClient - Whether the tag follows the page's client.
 * @returns A function that removes the listener.
 */
export function onPageClientChange(
  reconnect: () => void,
  followsPageClient: () => boolean,
): () => void {
  const listener = () => {
    if (followsPageClient()) reconnect()
  }
  shared.clientListeners.add(listener)
  return () => {
    shared.clientListeners.delete(listener)
  }
}

/**
 * Returns the `QueryClient` for the current render.
 *
 * - On the server it is the request's client, stored on `$global` and created
 *   on first use with the factory. Pass `$global` (in Marko Run, the request
 *   context).
 * - In the browser it is the page's client. Passing `$global` hydrates it with
 *   the state the server serialized there; `$global` may be omitted in
 *   browser-only code.
 * @param global - The render's `$global`. It is required on the server.
 * @returns The client of the request, or the client of the page.
 * @throws {Error} When `global` is missing on the server.
 */
export function getQueryClient(global?: object): QueryClient {
  if (environmentManager.isServer()) {
    if (!global) {
      throw new Error(
        '[marko-query] getQueryClient($global): on the server the client belongs to a request, so pass its $global.',
      )
    }
    const record = global as GlobalRecord
    const existing = record[CLIENT_KEY] as QueryClient | undefined
    if (!existing) {
      warnDefaultFactory()
      const client = shared.factory()
      attachServerClient(record, client)
      return client
    }
    // A spread of the request context copies the client but turns the state
    // getter into a value, so restore the getter to dehydrate as late as possible.
    if (!Object.getOwnPropertyDescriptor(record, DEHYDRATED_STATE_KEY)?.get) {
      attachServerClient(record, existing)
    }
    return existing
  }

  const client = (shared.browserClient ??= createBrowserClient())
  if (global) hydrateGlobal(client, global as GlobalRecord)
  return client
}

/**
 * The client a tag uses: its `client` input if given, else the `$global` one.
 * @param global - The render's `$global`.
 * @param client - The `client` input of the tag: a function that returns a client.
 * @returns The client that the tag must use.
 */
export function resolveClient(
  global: object | undefined,
  client: (() => QueryClient) | undefined,
): QueryClient {
  return client ? client() : getQueryClient(global)
}

/**
 * Whether the client's cache is being restored, e.g. by a persister.
 * @param client - The client to read.
 * @returns `true` while the cache is being restored.
 */
export function isRestoring(client: QueryClient): boolean {
  return shared.restoring.get(client)?.value ?? false
}

/**
 * Marks the client's cache as being restored. While it is `true`, tags render
 * their `isRestoring` result and do not subscribe, so nothing fetches before
 * the persisted cache is back.
 * @param client - The client to mark.
 * @param value - `true` while the cache is being restored.
 */
export function setIsRestoring(client: QueryClient, value: boolean): void {
  let entry = shared.restoring.get(client)
  if (!entry) {
    if (!value) return
    entry = { value, listeners: new Set() }
    shared.restoring.set(client, entry)
  }
  if (entry.value === value) return
  entry.value = value
  for (const listener of [...entry.listeners]) listener()
}

/**
 * Subscribes to changes of {@link isRestoring} for `client`.
 * @param client - The client to watch.
 * @param listener - Called each time the value changes.
 * @returns A function that removes the listener.
 */
export function onRestoringChange(
  client: QueryClient,
  listener: () => void,
): () => void {
  let entry = shared.restoring.get(client)
  if (!entry) {
    entry = { value: false, listeners: new Set() }
    shared.restoring.set(client, entry)
  }
  const listeners = entry.listeners
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
