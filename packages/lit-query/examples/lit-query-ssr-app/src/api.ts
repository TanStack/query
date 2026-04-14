import type { CreateQueryOptions } from '@tanstack/lit-query'

export const DATA_QUERY_KEY = ['ssr-example-data'] as const
export const DEFAULT_MESSAGE = 'Hello from SSR!'
export const QUERY_STALE_TIME = 30_000

export type DataResponse = {
  message: string
  requestCount: number
  servedAt: string
}

function resolveApiUrl(pathname: string, apiBaseUrl: string): string {
  if (!apiBaseUrl) {
    return pathname
  }

  return new URL(pathname, apiBaseUrl).toString()
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  let payload: TResponse | { error?: string } | null = null

  try {
    payload = (await response.json()) as TResponse | { error?: string }
  } catch {
    if (response.ok) {
      throw new Error(
        `Failed to parse JSON response with status ${response.status}.`,
      )
    }
  }

  if (!response.ok) {
    const errorDetail =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? `: ${payload.error}`
        : ''

    throw new Error(
      `Request failed with status ${response.status}${errorDetail}`,
    )
  }

  return payload as TResponse
}

export function createDataQueryOptions(apiBaseUrl = '') {
  return {
    queryKey: DATA_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch(resolveApiUrl('/api/data', apiBaseUrl))
      return readJson<DataResponse>(response)
    },
    retry: false,
    staleTime: QUERY_STALE_TIME,
  } satisfies CreateQueryOptions<
    DataResponse,
    Error,
    DataResponse,
    DataResponse,
    typeof DATA_QUERY_KEY
  >
}
