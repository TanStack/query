import { createServer } from 'node:http'
import { API_PORT } from '../config/ports.js'

const PAGE_SIZE = 10
const TOTAL_PROJECTS = 50
const JSON_CONTENT_TYPE = 'application/json'

function createSeedProjects() {
  return Array.from({ length: TOTAL_PROJECTS }, (_, index) => ({
    id: index + 1,
    name: `Project ${index + 1}`,
    owner: `Team ${(index % 5) + 1}`,
    isFavorite: false,
  }))
}

let projects = createSeedProjects()
let nextProjectId = projects.length + 1
let totalRequestCount = 0
let totalMutationCount = 0
let failNextMutation = false
const perPageRequestCount = new Map()

function writeJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function parsePositiveInt(rawValue, fallback) {
  if (rawValue == null || rawValue === '') {
    return fallback
  }

  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined
  }

  return parsed
}

function parseNonNegativeInt(rawValue, fallback) {
  if (rawValue == null || rawValue === '') {
    return fallback
  }

  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined
  }

  return parsed
}

function resetState() {
  projects = createSeedProjects()
  nextProjectId = projects.length + 1
  totalRequestCount = 0
  totalMutationCount = 0
  failNextMutation = false
  perPageRequestCount.clear()
}

async function sleep(ms) {
  if (!ms || ms <= 0) {
    return
  }

  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function readJsonBody(req) {
  const contentType = req.headers['content-type']
  if (!contentType || !contentType.startsWith(JSON_CONTENT_TYPE)) {
    return {
      ok: false,
      status: 415,
      error: 'Expected application/json request body',
    }
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) {
    return {
      ok: false,
      status: 400,
      error: 'Request body is required',
    }
  }

  try {
    return {
      ok: true,
      value: JSON.parse(raw),
    }
  } catch {
    return {
      ok: false,
      status: 400,
      error: 'Request body must be valid JSON',
    }
  }
}

function buildProjectsPage(page) {
  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
  const boundedPage = Math.min(page, totalPages)
  const startIndex = (boundedPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const items = projects.slice(startIndex, endIndex)

  totalRequestCount += 1
  const pageRequests = (perPageRequestCount.get(boundedPage) ?? 0) + 1
  perPageRequestCount.set(boundedPage, pageRequests)

  return {
    page: boundedPage,
    pageSize: PAGE_SIZE,
    totalPages,
    totalProjects: projects.length,
    hasMore: boundedPage < totalPages,
    projects: items,
    requestMeta: {
      totalRequestCount,
      pageRequestCount: pageRequests,
      totalMutationCount,
    },
  }
}

function maybeFailMutation(res) {
  if (!failNextMutation) {
    return false
  }

  failNextMutation = false
  writeJson(res, 500, { error: 'Forced mutation failure (test)' })
  return true
}

function validateProjectName(name) {
  if (typeof name !== 'string') {
    return 'Project name must be a string'
  }

  const trimmed = name.trim()
  if (trimmed.length < 3) {
    return 'Project name must be at least 3 characters'
  }

  if (trimmed.length > 60) {
    return 'Project name must be 60 characters or fewer'
  }

  return null
}

function validateOwner(owner) {
  if (typeof owner !== 'string') {
    return 'Owner must be a string'
  }

  const trimmed = owner.trim()
  if (!trimmed) {
    return 'Owner is required'
  }

  if (trimmed.length > 40) {
    return 'Owner must be 40 characters or fewer'
  }

  return null
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
      'access-control-allow-headers': 'content-type',
      'cache-control': 'no-store',
    })
    res.end()
    return
  }

  if (!req.url) {
    writeJson(res, 400, { error: 'Missing URL' })
    return
  }

  const requestUrl = new URL(req.url, `http://127.0.0.1:${API_PORT}`)

  if (requestUrl.pathname === '/api/projects' && req.method === 'GET') {
    const page = parsePositiveInt(requestUrl.searchParams.get('page'), 1)
    if (!page) {
      writeJson(res, 400, { error: 'Invalid page parameter' })
      return
    }

    const delayMs = parseNonNegativeInt(requestUrl.searchParams.get('delay'), 0)
    if (delayMs === undefined) {
      writeJson(res, 400, { error: 'Invalid delay parameter' })
      return
    }

    await sleep(delayMs)

    if (requestUrl.searchParams.get('error') === 'true') {
      writeJson(res, 500, {
        error: 'Forced server error (test)',
        page,
      })
      return
    }

    writeJson(res, 200, buildProjectsPage(page))
    return
  }

  if (requestUrl.pathname === '/api/projects' && req.method === 'POST') {
    if (maybeFailMutation(res)) {
      return
    }

    const payload = await readJsonBody(req)
    if (!payload.ok) {
      writeJson(res, payload.status, { error: payload.error })
      return
    }

    const nameError = validateProjectName(payload.value?.name)
    if (nameError) {
      writeJson(res, 422, { error: nameError })
      return
    }

    const ownerError = validateOwner(payload.value?.owner)
    if (ownerError) {
      writeJson(res, 422, { error: ownerError })
      return
    }

    const project = {
      id: nextProjectId,
      name: payload.value.name.trim(),
      owner: payload.value.owner.trim(),
      isFavorite: false,
    }

    nextProjectId += 1
    totalMutationCount += 1
    projects = [project, ...projects]

    writeJson(res, 201, {
      project,
      mutationCount: totalMutationCount,
    })
    return
  }

  const patchMatch = requestUrl.pathname.match(/^\/api\/projects\/(\d+)$/)
  if (patchMatch && req.method === 'PATCH') {
    if (maybeFailMutation(res)) {
      return
    }

    const projectId = Number.parseInt(patchMatch[1], 10)
    const projectIndex = projects.findIndex(
      (project) => project.id === projectId,
    )
    if (projectIndex === -1) {
      writeJson(res, 404, { error: `Project ${projectId} was not found` })
      return
    }

    const payload = await readJsonBody(req)
    if (!payload.ok) {
      writeJson(res, payload.status, { error: payload.error })
      return
    }

    if (typeof payload.value?.isFavorite !== 'boolean') {
      writeJson(res, 422, { error: 'isFavorite must be a boolean' })
      return
    }

    const nextProject = {
      ...projects[projectIndex],
      isFavorite: payload.value.isFavorite,
    }

    totalMutationCount += 1
    projects = projects.map((project, index) =>
      index === projectIndex ? nextProject : project,
    )

    writeJson(res, 200, {
      project: nextProject,
      mutationCount: totalMutationCount,
    })
    return
  }

  if (
    requestUrl.pathname === '/api/testing/fail-next-mutation' &&
    req.method === 'POST'
  ) {
    failNextMutation = true
    writeJson(res, 200, { ok: true })
    return
  }

  if (requestUrl.pathname === '/api/reset' && req.method === 'POST') {
    resetState()
    writeJson(res, 200, { ok: true })
    return
  }

  writeJson(res, 404, { error: 'Not found' })
})

server.listen(API_PORT, '127.0.0.1', () => {
  console.log(`[api] listening on http://127.0.0.1:${API_PORT}`)
})
