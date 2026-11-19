import http from 'node:http'

// Tiny QUERY-capable Algolia search mock for the algolia example.
// Mirrors the two read search endpoints that @algolia/client-search uses:
// the single-index query endpoint (searchSingleIndex) and the multi-index
// queries endpoint (search) — see READ_SEARCH_PATHS below.
// Both are answered on POST and QUERY, and OPTIONS advertises QUERY support
// through Accept-Query/Allow (RFC 10008 §3). Node's http server dispatches the
// QUERY verb natively; no dependencies needed.

const port = Number(process.env.PORT ?? 8048)

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS, GET, HEAD, POST, QUERY',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': 'accept-query, allow, content-type',
}

const acceptQuery = '"text/plain"'

const hits = [
  { objectID: '1', name: '43" Crystal UHD 4K Smart TV', price: 379.99 },
  { objectID: '2', name: '65" QLED 4K Smart TV', price: 899.99 },
  { objectID: '3', name: '55" 4K HDR Smart TV', price: 449.99 },
  { objectID: '4', name: '75" 4K UHD Smart TV', price: 999.99 },
  { objectID: '5', name: '32" HD Smart TV', price: 179.99 },
  { objectID: '6', name: 'Soundbar with Subwoofer', price: 249.99 },
  { objectID: '7', name: '4K Blu-ray Player', price: 129.99 },
  { objectID: '8', name: 'Universal TV Wall Mount', price: 49.99 },
]

function sendJson(res, status, payload, extra = {}) {
  res.writeHead(status, {
    ...cors,
    'content-type': 'application/json',
    'accept-query': acceptQuery,
    ...extra,
  })
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Extract { query, page, hitsPerPage } from either request flavor's body. */
function extractSearchParams(body, pathname) {
  if (pathname.endsWith('/queries')) {
    const first = body?.requests?.[0]
    const params = new URLSearchParams(first?.params ?? '')
    return {
      query: params.get('query') ?? '',
      page: Number(params.get('page') ?? 0),
      hitsPerPage: Number(params.get('hitsPerPage') ?? 20),
    }
  }
  return {
    query: body?.query ?? '',
    page: Number(body?.page ?? 0),
    hitsPerPage: Number(body?.hitsPerPage ?? 20),
  }
}

function searchResult({ query, page, hitsPerPage }) {
  const perPage = hitsPerPage > 0 ? hitsPerPage : 20
  const start = page * perPage
  const term = query.trim().toLowerCase()
  const matched = term
    ? hits.filter((hit) => hit.name.toLowerCase().includes(term))
    : hits
  return {
    hits: matched.slice(start, start + perPage),
    nbHits: matched.length,
    page,
    nbPages: Math.max(1, Math.ceil(matched.length / perPage)),
    processingTimeMS: 1,
    query,
    index: 'bestbuy',
  }
}

const READ_SEARCH_PATH = /^\/1\/indexes\/(?:[^/]+\/query|\*\/queries)$/

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  if (!READ_SEARCH_PATH.test(url.pathname)) {
    sendJson(res, 404, { message: 'Not found' })
    return
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...cors,
      allow: 'OPTIONS, GET, HEAD, POST, QUERY',
      'accept-query': acceptQuery,
    })
    res.end()
    return
  }

  if (req.method !== 'POST' && req.method !== 'QUERY') {
    sendJson(
      res,
      405,
      { message: 'Method not allowed' },
      { allow: 'OPTIONS, GET, HEAD, POST, QUERY' },
    )
    return
  }

  try {
    const body = JSON.parse((await readBody(req)) || '{}')
    const result = searchResult(extractSearchParams(body, url.pathname))
    const payload = url.pathname.endsWith('/queries')
      ? { results: [result] }
      : result
    sendJson(res, 200, payload, {
      'x-query-verb-mock': req.method,
    })
  } catch {
    sendJson(res, 400, { message: 'Invalid JSON body' })
  }
})

server.listen(port, () => {
  console.log(
    `[algolia-query-verb-mock] listening on http://localhost:${port} (OPTIONS + QUERY + POST on /1/indexes/... search paths)`,
  )
})
