import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'
import { QueryClient, dehydrate } from '@tanstack/lit-query'
import {
  SSR_BASE_URL,
  SSR_HOST,
  SSR_PORT,
  SSR_PUBLIC_ORIGIN,
} from '../config/ports.js'
import {
  DATA_QUERY_KEY,
  DEFAULT_MESSAGE,
  QUERY_STALE_TIME,
  createDataQueryOptions,
} from '../src/api.js'
import {
  getSsrQueryControllerCreationCount,
  resetSsrQueryControllerCreationCount,
} from '../src/app.ts'

const serverDir = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(serverDir, '../dist')
const templatePath = resolve(distDir, 'index.html')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
}

let requestCount = 0
let failNextDataRequest = false
let nextDataDelayMs = 0

const apiCorsHeaders = {
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-origin': '*',
}

function createBrowserQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: QUERY_STALE_TIME,
      },
    },
  })
}

function nextDataResponse() {
  requestCount += 1
  return {
    message: DEFAULT_MESSAGE,
    requestCount,
    servedAt: new Date().toISOString(),
  }
}

function resetApiState() {
  requestCount = 0
  failNextDataRequest = false
  nextDataDelayMs = 0
}

function parseNonNegativeDelayMs(value) {
  const parsedDelayMs = Number.parseInt(value ?? '', 10)
  if (!Number.isInteger(parsedDelayMs) || parsedDelayMs < 0) {
    return undefined
  }

  return parsedDelayMs
}

async function consumeNextDataDelay() {
  const delayMs = nextDataDelayMs
  nextDataDelayMs = 0

  if (delayMs > 0) {
    await sleep(delayMs)
  }
}

function consumeFailNextDataRequest() {
  if (!failNextDataRequest) {
    return false
  }

  failNextDataRequest = false
  return true
}

function writeBuffer(res, statusCode, contentType, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'cache-control': 'no-store',
    'content-length': payload.byteLength,
    'content-type': contentType,
    ...extraHeaders,
  })
  res.end(payload)
}

function writeHtml(res, statusCode, body, extraHeaders = {}) {
  const payload = Buffer.from(body)
  writeBuffer(
    res,
    statusCode,
    'text/html; charset=utf-8',
    payload,
    extraHeaders,
  )
}

function writeJson(res, statusCode, body) {
  const payload = Buffer.from(JSON.stringify(body))
  writeBuffer(
    res,
    statusCode,
    'application/json; charset=utf-8',
    payload,
    apiCorsHeaders,
  )
}

function serializeJsonForHtml(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case '<':
        return '\\u003c'
      case '>':
        return '\\u003e'
      case '&':
        return '\\u0026'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
      default:
        return character
    }
  })
}

async function readTemplate() {
  try {
    return await readFile(templatePath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw new Error(
        'Missing built client assets. Run "pnpm --dir examples/lit/ssr run build" from the repo root first.',
      )
    }

    throw error
  }
}

async function serveAsset(pathname, res) {
  if (!pathname.startsWith('/assets/')) {
    return false
  }

  const assetPath = resolve(distDir, `.${pathname}`)
  const distRootPrefix = `${distDir}${sep}`
  if (!assetPath.startsWith(distRootPrefix)) {
    return false
  }

  try {
    const file = await readFile(assetPath)
    const contentType =
      contentTypes[extname(assetPath)] ?? 'application/octet-stream'
    writeBuffer(res, 200, contentType, file)
    return true
  } catch {
    return false
  }
}

async function renderPage(res) {
  const queryClient = createBrowserQueryClient()
  resetSsrQueryControllerCreationCount(queryClient)
  await queryClient.prefetchQuery(createDataQueryOptions(SSR_PUBLIC_ORIGIN))

  const prefetchedQueryState = queryClient.getQueryState(DATA_QUERY_KEY)
  if (prefetchedQueryState?.status !== 'success') {
    throw new Error(
      'SSR prefetch did not complete successfully. Refusing to render loading HTML.',
    )
  }

  const appHtml = await collectResult(
    render(
      html`<ssr-app
        api-base-url=${SSR_PUBLIC_ORIGIN}
        .queryClient=${queryClient}
      ></ssr-app>`,
    ),
  )

  const dehydratedState = dehydrate(queryClient)
  const controllerCreationCount =
    getSsrQueryControllerCreationCount(queryClient)
  if (controllerCreationCount < 1) {
    throw new Error('SSR render did not exercise createQueryController.')
  }

  const template = await readTemplate()
  const htmlDocument = template
    .replace('__SSR_APP_HTML__', appHtml)
    .replace('__QUERY_STATE_JSON__', serializeJsonForHtml(dehydratedState))

  writeHtml(res, 200, htmlDocument, {
    'x-ssr-query-controller-created': String(controllerCreationCount),
  })
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', SSR_BASE_URL)
  const method = req.method ?? 'GET'

  if (method === 'OPTIONS' && requestUrl.pathname.startsWith('/api/')) {
    res.writeHead(204, {
      'cache-control': 'no-store',
      ...apiCorsHeaders,
    })
    res.end()
    return
  }

  if (method === 'GET' && requestUrl.pathname === '/api/data') {
    await consumeNextDataDelay()

    if (consumeFailNextDataRequest()) {
      writeJson(res, 500, { error: 'Forced data failure (test)' })
      return
    }

    writeJson(res, 200, nextDataResponse())
    return
  }

  if (method === 'GET' && requestUrl.pathname === '/api/request-count') {
    writeJson(res, 200, { count: requestCount })
    return
  }

  if (method === 'POST' && requestUrl.pathname === '/api/reset') {
    resetApiState()
    writeJson(res, 200, { ok: true })
    return
  }

  if (method === 'POST' && requestUrl.pathname === '/api/test/fail-next-data') {
    failNextDataRequest = true
    writeJson(res, 200, { ok: true })
    return
  }

  if (
    method === 'POST' &&
    requestUrl.pathname === '/api/test/delay-next-data'
  ) {
    const delayMs = parseNonNegativeDelayMs(requestUrl.searchParams.get('ms'))
    if (delayMs === undefined) {
      writeJson(res, 400, { error: 'Invalid ms query parameter.' })
      return
    }

    nextDataDelayMs = delayMs
    writeJson(res, 200, { ok: true, delayMs })
    return
  }

  if (method === 'GET' && requestUrl.pathname === '/') {
    try {
      await renderPage(res)
    } catch (error) {
      console.error('[ssr] render failed:', error)
      writeHtml(
        res,
        500,
        '<!doctype html><html><body>SSR render failed.</body></html>',
      )
    }
    return
  }

  if (method === 'GET' && (await serveAsset(requestUrl.pathname, res))) {
    return
  }

  writeJson(res, 404, { error: 'Not found' })
})

server.listen(SSR_PORT, SSR_HOST, () => {
  console.log(
    `[ssr] listening on ${SSR_BASE_URL} (public origin ${SSR_PUBLIC_ORIGIN})`,
  )
})
