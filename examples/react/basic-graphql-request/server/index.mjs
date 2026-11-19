import http from 'node:http'

// Tiny QUERY-capable GraphQL mock for the basic-graphql-request example.
// Answers OPTIONS (QUERY discovery, RFC 10008 §3) plus POST and QUERY on
// /api with the same fixture data, so the client's POST fallback and QUERY
// happy path can be compared side by side. Node's http server dispatches the
// QUERY verb natively; no dependencies needed.

const port = Number(process.env.PORT ?? 8047)

const posts = [
  {
    id: '1',
    title: 'sunt aut facere repellat provident occaecati excepturi optio',
    body: 'quia et suscipit suscipit recusandae consequuntur expedita',
  },
  {
    id: '2',
    title: 'qui est esse',
    body: 'est rerum tempore vitae sequi sint nihil reprehenderit dolor',
  },
  {
    id: '3',
    title: 'ea molestias quasi exercitationem repellat qui ipsa sit aut',
    body: 'et iusto sed quo iure voluptatem occaecati omnis eligendi aut ad',
  },
  {
    id: '4',
    title: 'eum et est occaecati',
    body: 'ullam et saepe reiciendis voluptatem adipisci sit amet autem assumenda',
  },
  {
    id: '5',
    title: 'nesciunt quas odio',
    body: 'repudiandae veniam quaerat sunt sed alias aut fugiat sit autem',
  },
  {
    id: '6',
    title: 'voluptatem est quia',
    body: 'quod et possimus handreiciis dolorem voluptas aliquid voluptatem',
  },
  {
    id: '7',
    title: 'dolores eligendi quia',
    body: 'cumque dolorem placeat tempore et nihil aut alias qui error',
  },
]

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS, GET, HEAD, POST, QUERY',
  'access-control-allow-headers': '*',
  'access-control-expose-headers': 'accept-query, allow, content-type',
}

const acceptQuery = '"application/json"'

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

function execute({ query, variables }) {
  if (typeof query !== 'string' || query.length === 0) {
    return { errors: [{ message: 'Missing query' }] }
  }
  if (query.includes('posts')) {
    return {
      data: { posts: { data: posts.map(({ id, title }) => ({ id, title })) } },
    }
  }
  if (query.includes('post(')) {
    const post = posts.find((p) => String(p.id) === String(variables?.id))
    return { data: { post: post ?? null } }
  }
  if (query.includes('mutation')) {
    return { errors: [{ message: 'Mutations are not supported by this mock' }] }
  }
  return { errors: [{ message: 'Unsupported query' }] }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  if (url.pathname !== '/api') {
    sendJson(res, 404, { errors: [{ message: 'Not found' }] })
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
      { errors: [{ message: 'Method not allowed' }] },
      { allow: 'OPTIONS, GET, HEAD, POST, QUERY' },
    )
    return
  }

  try {
    const result = execute(JSON.parse((await readBody(req)) || '{}'))
    const status = result.errors ? 400 : 200
    sendJson(res, status, result, {
      'x-query-verb-mock': req.method,
    })
  } catch {
    sendJson(res, 400, { errors: [{ message: 'Invalid JSON body' }] })
  }
})

server.listen(port, () => {
  console.log(
    `[graphql-query-verb-mock] listening on http://localhost:${port}/api (OPTIONS + QUERY + POST)`,
  )
})
