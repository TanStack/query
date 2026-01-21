import { createClient, createConfig } from '@hey-api/client-next'
import { queryOptions } from '@tanstack/react-query'

import type {
  Client,
  ClientOptions,
  CreateClientConfig,
  Options as HeyApiOptions,
  TDataShape,
} from '@hey-api/client-next'

export type Options<
  TData extends TDataShape = TDataShape,
  TThrowOnError extends boolean = boolean,
> = HeyApiOptions<TData, TThrowOnError> & {
  /**
   * You can provide a client instance returned by `createClient()` instead of
   * individual options. This might be also useful if you want to implement a
   * custom client.
   */
  client?: Client
  /**
   * You can pass arbitrary values through the `meta` object. This can be
   * used to access values that aren't defined as part of the SDK function.
   */
  meta?: Record<string, unknown>
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: 'https://fakerestapi.azurewebsites.net/',
})

export const _heyApiClient = createClient(
  createClientConfig(
    createConfig<ClientOptions>({
      baseUrl: 'https://fakerestapi.azurewebsites.net',
    }),
  ),
)

export type GetApiV1ActivitiesData = {
  body?: never
  path?: never
  query?: never
  url: '/api/v1/Activities'
}

export type Activity = {
  id?: number
  title?: string | null
  dueDate?: string
  completed?: boolean
}

export type Author = {
  id?: number
  idBook?: number
  firstName?: string | null
  lastName?: string | null
}

export type GetApiV1ActivitiesResponses = {
  /**
   * Success
   */
  200: Array<Activity>
}

export type GetApiV1AuthorsData = {
  body?: never
  path?: never
  query?: never
  url: '/api/v1/Authors'
}

export type GetApiV1ActivitiesResponse =
  GetApiV1ActivitiesResponses[keyof GetApiV1ActivitiesResponses]

export type QueryKey<TOptions extends Options> = [
  Pick<TOptions, 'baseUrl' | 'body' | 'headers' | 'path' | 'query'> & {
    _id: string
    _infinite?: boolean
  },
]

const createQueryKey = <TOptions extends Options>(
  id: string,
  options?: TOptions,
  infinite?: boolean,
): [QueryKey<TOptions>[0]] => {
  const params: QueryKey<TOptions>[0] = {
    _id: id,
    baseUrl: (options?.client ?? _heyApiClient).getConfig().baseUrl,
  } as QueryKey<TOptions>[0]
  if (infinite) {
    params._infinite = infinite
  }
  if (options?.body) {
    params.body = options.body
  }
  if (options?.headers) {
    params.headers = options.headers
  }
  if (options?.path) {
    params.path = options.path
  }
  if (options?.query) {
    params.query = options.query
  }
  return [params]
}

export const getApiV1Activities = <TThrowOnError extends boolean = false>(
  options?: Options<GetApiV1ActivitiesData, TThrowOnError>,
) => {
  return (options?.client ?? _heyApiClient).get<
    GetApiV1ActivitiesResponse,
    unknown,
    TThrowOnError
  >({
    url: '/api/v1/Activities',
    ...options,
  })
}

export const getApiV1ActivitiesQueryKey = (
  options?: Options<GetApiV1ActivitiesData>,
) => createQueryKey('getApiV1Activities', options)

export const getApiV1ActivitiesOptions = (
  options?: Options<GetApiV1ActivitiesData>,
) => {
  return queryOptions({
    queryFn: async ({ queryKey, signal }) => {
      const { data } = await getApiV1Activities({
        ...options,
        ...queryKey[0],
        signal,
        throwOnError: true,
      })
      return data
    },
    queryKey: getApiV1ActivitiesQueryKey(options),
  })
}

export type GetApiV1AuthorsResponses = {
  /**
   * Success
   */
  200: Array<Author>
}

export type GetApiV1AuthorsResponse =
  GetApiV1AuthorsResponses[keyof GetApiV1AuthorsResponses]

export const getApiV1Authors = <TThrowOnError extends boolean = false>(
  options?: Options<GetApiV1AuthorsData, TThrowOnError>,
) => {
  return (options?.client ?? _heyApiClient).get<
    GetApiV1AuthorsResponse,
    unknown,
    TThrowOnError
  >({
    url: '/api/v1/Authors',
    ...options,
  })
}

export const getApiV1AuthorsQueryKey = (
  options?: Options<GetApiV1AuthorsData>,
) => createQueryKey('getApiV1Authors', options)

export const getApiV1AuthorsOptions = (
  options?: Options<GetApiV1AuthorsData>,
) => {
  return queryOptions({
    queryFn: async ({ queryKey, signal }) => {
      const { data } = await getApiV1Authors({
        ...options,
        ...queryKey[0],
        signal,
        throwOnError: true,
      })
      return data
    },
    queryKey: getApiV1AuthorsQueryKey(options),
  })
}
