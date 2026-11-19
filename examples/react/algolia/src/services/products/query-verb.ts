/**
 * Opt-in support for the HTTP QUERY method (RFC 10008) for cacheable reads,
 * implemented as an Algolia requester wrapper.
 *
 * Two configuration flags, both opt-in and disabled by default:
 *
 * - `enabled`: allow the QUERY method for cacheable reads at all. While this
 *   is disabled, requests are sent exactly as they were before (POST), with no
 *   extra network traffic. Defaults to `VITE_HTTP_QUERY_VERB === '1'`.
 * - `trustServerSupport`: skip QUERY-support discovery and send QUERY
 *   directly. While this is disabled (and `enabled` is on), a preflight
 *   `OPTIONS` request must signal QUERY support for the query media type via
 *   an `Accept-Query` or `Allow` response field (RFC 10008, sections 2 and 3);
 *   otherwise the request falls back to POST. Defaults to
 *   `VITE_HTTP_QUERY_VERB_TRUST === '1'`.
 *
 * Only Algolia's read search endpoints (single-index query and multi-index
 * queries, see READ_SEARCH_PATHS) are upgraded to QUERY; every other Algolia
 * operation (writes, settings changes, etc.) passes through untouched, so
 * mutations can never end up on the QUERY verb.
 *
 * `VITE_ALGOLIA_MOCK_BASE` optionally rewrites the request origin, e.g. to the
 * example's local QUERY-capable mock server (`server/index.mjs`).
 */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env

export interface QueryVerbConfig {
  enabled: boolean
  trustServerSupport: boolean
}

let config: QueryVerbConfig = {
  enabled: env?.VITE_HTTP_QUERY_VERB === '1',
  trustServerSupport: env?.VITE_HTTP_QUERY_VERB_TRUST === '1',
}

/** Overrides the QUERY-verb configuration at runtime. */
export function configureQueryVerb(options: Partial<QueryVerbConfig>): void {
  config = { ...config, ...options }
}

/** Returns a copy of the current QUERY-verb configuration. */
export function getQueryVerbConfig(): QueryVerbConfig {
  return { ...config }
}

const preflightResults = new Map<string, Promise<boolean>>()

/** Clears cached QUERY-support preflight results, e.g. after pointing at a different server. */
export function resetQueryVerbPreflight(): void {
  preflightResults.clear()
}

/**
 * Parses the `Accept-Query` response field (RFC 10008, section 3): a comma
 * separated structured-field list of media ranges, each a quoted string or a
 * bare token, optionally followed by parameters. Parameters are ignored.
 */
function parseAcceptQuery(value: string): Array<string> {
  const mediaRanges: Array<string> = []
  let current = ''
  let inQuotes = false

  for (const char of value) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      pushMediaRange(mediaRanges, current)
      current = ''
      continue
    }
    current += char
  }
  pushMediaRange(mediaRanges, current)

  return mediaRanges
}

function pushMediaRange(target: Array<string>, raw: string): void {
  let item = raw.trim()
  if (!item) {
    return
  }
  if (item.startsWith('"')) {
    const end = item.indexOf('"', 1)
    item = end > 0 ? item.slice(1, end) : item.slice(1)
  } else {
    const parameter = item.indexOf(';')
    if (parameter > -1) {
      item = item.slice(0, parameter)
    }
  }
  item = item.trim().toLowerCase()
  if (item) {
    target.push(item)
  }
}

function supportsMediaType(mediaRanges: Array<string>, mediaType: string): boolean {
  const type = mediaType.toLowerCase().split(';')[0]?.trim() ?? ''
  if (!type) {
    return false
  }
  const prefix = type.split('/')[0]
  return (
    mediaRanges.includes(type) ||
    mediaRanges.includes(`${prefix}/*`) ||
    mediaRanges.includes('*/*')
  )
}

/**
 * Resolves whether QUERY may be used for `url` under the current
 * configuration: always `false` when disabled, always `true` when trusting the
 * server, otherwise the cached result of one `OPTIONS` preflight per
 * origin/path + media type pair. Concurrent lookups share one preflight.
 */
export function queryVerbIsSupported(
  url: string,
  mediaType: string,
): Promise<boolean> {
  if (!config.enabled) {
    return Promise.resolve(false)
  }
  if (config.trustServerSupport) {
    return Promise.resolve(true)
  }
  const parsed = new URL(url)
  const key = `${parsed.origin}${parsed.pathname} ${
    mediaType.toLowerCase().split(';')[0]?.trim() ?? ''
  }`

  let result = preflightResults.get(key)
  if (!result) {
    result = detectQuerySupport(parsed, mediaType).catch(() => false)
    preflightResults.set(key, result)
  }
  return result
}

async function detectQuerySupport(url: URL, mediaType: string): Promise<boolean> {
  const response = await fetch(url, { method: 'OPTIONS' })

  const acceptQuery = response.headers.get('accept-query')
  if (acceptQuery) {
    return supportsMediaType(parseAcceptQuery(acceptQuery), mediaType)
  }

  const allow = response.headers.get('allow')
  if (allow) {
    return allow
      .split(',')
      .some((method) => method.trim().toUpperCase() === 'QUERY')
  }

  return false
}

async function resolveCacheableMethod(
  url: string,
  method: string,
  mediaType: string,
): Promise<string> {
  if (method.toUpperCase() !== 'POST') {
    return method
  }
  if (await queryVerbIsSupported(url, mediaType)) {
    return 'QUERY'
  }
  return method
}

/** Algolia read search endpoints only — everything else must stay on POST. */
const READ_SEARCH_PATHS = /^\/1\/indexes\/(?:[^/]+\/query|\*\/queries)$/

interface AlgoliaEndRequest {
  method: string
  url: string
  headers: Record<string, string>
  data?: string | Uint8Array
  responseTimeout: number
}

interface AlgoliaRequestResponse {
  content: string
  headers?: Record<string, string>
  isTimedOut: boolean
  status: number
}

/**
 * A `@algolia/client-search` requester that upgrades the read search
 * endpoints from POST to QUERY when the QUERY verb is enabled and supported,
 * mirroring `fetch`-requester behavior otherwise. Pass it to `searchClient()`
 * as `{ requester: createQueryVerbRequester() }`.
 */
export function createQueryVerbRequester(): {
  send: (request: AlgoliaEndRequest) => Promise<AlgoliaRequestResponse>
} {
  return {
    async send(endRequest) {
      let url = endRequest.url

      const mockBase = env?.VITE_ALGOLIA_MOCK_BASE
      if (mockBase) {
        const parsed = new URL(url)
        url = new URL(`${parsed.pathname}${parsed.search}`, mockBase).toString()
      }

      let method = endRequest.method
      if (
        method.toUpperCase() === 'POST' &&
        READ_SEARCH_PATHS.test(new URL(url).pathname)
      ) {
        method = await resolveCacheableMethod(url, method, 'text/plain')
      }

      const response = await fetch(url, {
        method,
        body: (endRequest.data ?? null) as RequestInit['body'],
        headers: endRequest.headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(endRequest.responseTimeout),
      })

      const headers: Record<string, string> = {}
      response.headers.forEach((value, header) => {
        headers[header] = value
      })

      return {
        content: await response.text(),
        headers,
        isTimedOut: false,
        status: response.status,
      }
    },
  }
}
