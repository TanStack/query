/**
 * Opt-in support for the HTTP QUERY method (RFC 10008) for cacheable reads.
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
 * IMPORTANT: this module is for safe, cacheable reads only. Mutations and any
 * request that changes server state must stay on POST and must never be sent
 * through `queryVerbFetch`.
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

export interface QueryVerbRequestInit extends RequestInit {
  /**
   * The media type of the query content, used for `Accept-Query` matching.
   * Defaults to `application/json`.
   */
  mediaType?: string
}

/**
 * `fetch` wrapper for cacheable read requests: keeps the request on its
 * original method unless the QUERY verb is enabled and the QUERY support
 * check (preflight or trust mode) passes, in which case `POST` is upgraded to
 * `QUERY`. GET requests are never rewritten. Must not be used for mutations.
 */
export async function queryVerbFetch(
  url: string,
  init: QueryVerbRequestInit = {},
): Promise<Response> {
  const { mediaType = 'application/json', ...fetchInit } = init
  const method = await resolveCacheableMethod(
    url,
    fetchInit.method ?? 'POST',
    mediaType,
  )
  return fetch(url, { ...fetchInit, method })
}
