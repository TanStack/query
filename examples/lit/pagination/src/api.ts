export type Project = {
  id: number
  name: string
  owner: string
  isFavorite: boolean
}

export type ProjectsPageResponse = {
  page: number
  pageSize: number
  totalPages: number
  totalProjects: number
  hasMore: boolean
  projects: Project[]
  requestMeta: {
    totalRequestCount: number
    pageRequestCount: number
    totalMutationCount: number
  }
}

export type CreateProjectInput = {
  name: string
  owner: string
}

export type ToggleProjectFavoriteInput = {
  id: number
  isFavorite: boolean
}

export type ProjectMutationResponse = {
  project: Project
  mutationCount: number
}

export type ProjectsQueryKey = readonly ['projects', number, number, boolean]

const DEFAULT_API_PORT = 4184
const configuredApiPort = Number.parseInt(
  import.meta.env.VITE_PAGINATION_API_PORT ?? String(DEFAULT_API_PORT),
  10,
)
const API_PORT = Number.isInteger(configuredApiPort)
  ? configuredApiPort
  : DEFAULT_API_PORT
const API_BASE_URL = `http://127.0.0.1:${API_PORT}`

function buildProjectsUrl(
  page: number,
  delayMs: number,
  forceError: boolean,
): URL {
  const url = new URL('/api/projects', API_BASE_URL)
  url.searchParams.set('page', String(page))

  if (delayMs > 0) {
    url.searchParams.set('delay', String(delayMs))
  }

  if (forceError) {
    url.searchParams.set('error', 'true')
  }

  return url
}

async function readJsonOrThrow<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: string
  } | null

  throw new Error(
    payload && typeof payload === 'object' && 'error' in payload
      ? String(payload.error ?? fallbackMessage)
      : fallbackMessage,
  )
}

async function requestJson<T>(
  url: URL,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(url, init)
  return readJsonOrThrow<T>(response, fallbackMessage)
}

export function projectsQueryKey(
  page: number,
  delayMs: number,
  forceError: boolean,
): ProjectsQueryKey {
  return ['projects', page, delayMs, forceError] as const
}

export async function fetchProjectsPage(
  page: number,
  delayMs: number,
  forceError: boolean,
): Promise<ProjectsPageResponse> {
  const response = await fetch(buildProjectsUrl(page, delayMs, forceError))
  return readJsonOrThrow<ProjectsPageResponse>(
    response,
    `Failed to fetch projects page ${page}`,
  )
}

export async function createProjectOnServer(
  input: CreateProjectInput,
): Promise<ProjectMutationResponse> {
  return requestJson<ProjectMutationResponse>(
    new URL('/api/projects', API_BASE_URL),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Failed to create project',
  )
}

export async function toggleProjectFavoriteOnServer(
  input: ToggleProjectFavoriteInput,
): Promise<ProjectMutationResponse> {
  return requestJson<ProjectMutationResponse>(
    new URL(`/api/projects/${input.id}`, API_BASE_URL),
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ isFavorite: input.isFavorite }),
    },
    `Failed to update project ${input.id}`,
  )
}

export async function armNextProjectMutationFailureOnServer(): Promise<void> {
  await requestJson<{ ok: true }>(
    new URL('/api/testing/fail-next-mutation', API_BASE_URL),
    {
      method: 'POST',
    },
    'Failed to arm next mutation failure',
  )
}

export async function resetProjectsApiState(): Promise<void> {
  await requestJson<{ ok: true }>(
    new URL('/api/reset', API_BASE_URL),
    {
      method: 'POST',
    },
    'Failed to reset API state',
  )
}
