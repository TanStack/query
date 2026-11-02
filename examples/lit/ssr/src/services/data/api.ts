import type { DataResponse } from './types.js'

export const DEFAULT_MESSAGE = 'Hello from SSR!'

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

export const dataAPI = {
  getData: async (
    apiBaseUrl: string,
    signal: AbortSignal,
  ): Promise<DataResponse> => {
    const response = await fetch(resolveApiUrl('/api/data', apiBaseUrl), {
      signal,
    })
    return readJson<DataResponse>(response)
  },
}
