import { beforeEach, describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  defaultShouldDehydrateMutation,
  defaultShouldDehydrateQuery,
  dehydrate,
  dehydrateQuery,
  hydrate,
} from '..'
import type {
  DefaultError,
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
  Mutation,
  MutationKey,
  MutationMeta,
  MutationOptions,
  MutationScope,
  MutationState,
  Query,
  QueryKey,
  QueryMeta,
  QueryOptions,
  QueryState,
} from '..'

type DehydratedQuery = DehydratedState['queries'][number]
type DehydratedMutation = DehydratedState['mutations'][number]

describe('hydration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  describe('dehydrate', () => {
    it('should take a query client and return a dehydrated state', () => {
      expectTypeOf(dehydrate(queryClient)).toEqualTypeOf<DehydratedState>()
    })

    it('should require a query client', () => {
      // @ts-expect-error the query client is required
      dehydrate()

      expectTypeOf(dehydrate(queryClient)).toEqualTypeOf<DehydratedState>()
    })

    it('should reject a value that is not a query client', () => {
      // @ts-expect-error a plain object is not a query client
      dehydrate({})

      expectTypeOf(dehydrate).parameter(0).toEqualTypeOf<QueryClient>()
    })

    it('should take optional dehydrate options as its second parameter', () => {
      expectTypeOf(dehydrate)
        .parameter(1)
        .toEqualTypeOf<DehydrateOptions | undefined>()

      expectTypeOf(dehydrate(queryClient, {})).toEqualTypeOf<DehydratedState>()
    })

    it('should take no more than two parameters', () => {
      // @ts-expect-error there is no third parameter
      dehydrate(queryClient, {}, 'extra')

      expectTypeOf(dehydrate).parameters.toEqualTypeOf<
        [client: QueryClient, options?: DehydrateOptions]
      >()
    })

    it('should reject an unknown dehydrate option', () => {
      dehydrate(queryClient, {
        // @ts-expect-error 'shouldDehydrateAll' is not a dehydrate option
        shouldDehydrateAll: true,
      })

      expectTypeOf(
        dehydrate(queryClient, { shouldDehydrateQuery: () => true }),
      ).toEqualTypeOf<DehydratedState>()
    })
  })

  describe('hydrate', () => {
    it('should take a query client and a dehydrated state and return void', () => {
      expectTypeOf(
        hydrate(queryClient, { queries: [], mutations: [] }),
      ).toEqualTypeOf<void>()
    })

    it('should accept a partial dehydrated state', () => {
      expectTypeOf(hydrate(queryClient, {})).toEqualTypeOf<void>()
      expectTypeOf(hydrate(queryClient, { queries: [] })).toEqualTypeOf<void>()
      expectTypeOf(
        hydrate(queryClient, { mutations: [] }),
      ).toEqualTypeOf<void>()

      expectTypeOf(hydrate)
        .parameter(1)
        .toEqualTypeOf<Partial<DehydratedState>>()
    })

    it('should require the dehydrated state', () => {
      // @ts-expect-error the dehydrated state is required
      hydrate(queryClient)

      expectTypeOf(hydrate(queryClient, {})).toEqualTypeOf<void>()
    })

    it('should take optional hydrate options as its third parameter', () => {
      expectTypeOf(hydrate)
        .parameter(2)
        .toEqualTypeOf<HydrateOptions | undefined>()

      expectTypeOf(
        hydrate(queryClient, {}, { defaultOptions: {} }),
      ).toEqualTypeOf<void>()
    })

    it('should take no more than three parameters', () => {
      // @ts-expect-error there is no fourth parameter
      hydrate(queryClient, {}, {}, 'extra')

      expectTypeOf(hydrate).parameters.toEqualTypeOf<
        [
          client: QueryClient,
          dehydratedState: Partial<DehydratedState>,
          options?: HydrateOptions,
        ]
      >()
    })

    it('should reject a dehydrated state with an unknown key', () => {
      hydrate(queryClient, {
        // @ts-expect-error 'infiniteQueries' is not part of a dehydrated state
        infiniteQueries: [],
      })

      expectTypeOf(hydrate(queryClient, { queries: [] })).toEqualTypeOf<void>()
    })
  })

  describe('dehydrateQuery', () => {
    it('should take a query and return a dehydrated query', () => {
      expectTypeOf(dehydrateQuery).parameter(0).toEqualTypeOf<Query>()
      expectTypeOf(dehydrateQuery).returns.toEqualTypeOf<DehydratedQuery>()
    })

    it('should take an optional serializeData transform', () => {
      expectTypeOf(dehydrateQuery)
        .parameter(1)
        .toEqualTypeOf<((data: any) => any) | undefined>()
    })

    it('should take an optional shouldRedactErrors predicate', () => {
      expectTypeOf(dehydrateQuery)
        .parameter(2)
        .toEqualTypeOf<((error: unknown) => boolean) | undefined>()
    })

    it('should require the query', () => {
      // @ts-expect-error the query is required
      dehydrateQuery()

      expectTypeOf(dehydrateQuery).parameters.toEqualTypeOf<
        [
          query: Query,
          serializeData?: (data: any) => any,
          shouldRedactErrors?: (error: unknown) => boolean,
        ]
      >()
    })
  })

  describe('DehydratedState', () => {
    it('should have queries and mutations arrays', () => {
      expectTypeOf<DehydratedState>().toEqualTypeOf<{
        mutations: Array<DehydratedMutation>
        queries: Array<DehydratedQuery>
      }>()
    })

    it('should require both of its keys', () => {
      // @ts-expect-error mutations is required
      const missing: DehydratedState = { queries: [] }

      expectTypeOf(missing).toEqualTypeOf<DehydratedState>()
      expectTypeOf<DehydratedState>().toHaveProperty('queries')
      expectTypeOf<DehydratedState>().toHaveProperty('mutations')
      // neither key may be optional
      expectTypeOf<
        keyof {
          [K in keyof DehydratedState as {} extends Pick<DehydratedState, K>
            ? K
            : never]: true
        }
      >().toEqualTypeOf<never>()
    })
  })

  describe('DehydratedQuery', () => {
    it('should keep every property writable', () => {
      expectTypeOf<DehydratedQuery>().toEqualTypeOf<{
        -readonly [K in keyof DehydratedQuery]: DehydratedQuery[K]
      }>()
    })

    describe('queryHash', () => {
      it('should be a required string', () => {
        expectTypeOf<DehydratedQuery['queryHash']>().toEqualTypeOf<string>()
      })
    })

    describe('queryKey', () => {
      it('should be a required query key', () => {
        expectTypeOf<DehydratedQuery['queryKey']>().toEqualTypeOf<QueryKey>()
      })
    })

    describe('state', () => {
      it('should be a required query state', () => {
        expectTypeOf<DehydratedQuery['state']>().toEqualTypeOf<QueryState>()
      })
    })

    describe('dehydratedAt', () => {
      it('should be a required number', () => {
        expectTypeOf<DehydratedQuery['dehydratedAt']>().toEqualTypeOf<number>()
      })
    })

    describe('promise', () => {
      it('should be an optional promise of unknown', () => {
        expectTypeOf<DehydratedQuery['promise']>().toEqualTypeOf<
          Promise<unknown> | undefined
        >()
      })
    })

    describe('meta', () => {
      it('should be optional query meta', () => {
        expectTypeOf<DehydratedQuery['meta']>().toEqualTypeOf<
          QueryMeta | undefined
        >()
      })
    })

    describe('queryType', () => {
      it('should only ever be infinite', () => {
        expectTypeOf<DehydratedQuery['queryType']>().toEqualTypeOf<
          'infinite' | undefined
        >()
      })

      it('should reject any other query type', () => {
        const query = {} as DehydratedQuery

        // @ts-expect-error 'paginated' is not a dehydrated query type
        const invalid: typeof query.queryType = 'paginated'

        expectTypeOf(invalid).toEqualTypeOf<'infinite' | undefined>()
      })
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof DehydratedQuery>().toEqualTypeOf<
        | 'queryHash'
        | 'queryKey'
        | 'state'
        | 'dehydratedAt'
        | 'promise'
        | 'meta'
        | 'queryType'
      >()
    })
  })

  describe('DehydratedMutation', () => {
    it('should keep every property writable', () => {
      expectTypeOf<DehydratedMutation>().toEqualTypeOf<{
        -readonly [K in keyof DehydratedMutation]: DehydratedMutation[K]
      }>()
    })

    describe('mutationKey', () => {
      it('should be an optional mutation key', () => {
        expectTypeOf<DehydratedMutation['mutationKey']>().toEqualTypeOf<
          MutationKey | undefined
        >()
      })
    })

    describe('state', () => {
      it('should be a required mutation state', () => {
        expectTypeOf<
          DehydratedMutation['state']
        >().toEqualTypeOf<MutationState>()
      })
    })

    describe('meta', () => {
      it('should be optional mutation meta', () => {
        expectTypeOf<DehydratedMutation['meta']>().toEqualTypeOf<
          MutationMeta | undefined
        >()
      })
    })

    describe('scope', () => {
      it('should be an optional mutation scope', () => {
        expectTypeOf<DehydratedMutation['scope']>().toEqualTypeOf<
          MutationScope | undefined
        >()
      })
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof DehydratedMutation>().toEqualTypeOf<
        'mutationKey' | 'state' | 'meta' | 'scope'
      >()
    })
  })

  describe('DehydrateOptions', () => {
    it('should keep every option writable', () => {
      expectTypeOf<DehydrateOptions>().toEqualTypeOf<{
        -readonly [K in keyof DehydrateOptions]: DehydrateOptions[K]
      }>()
    })

    describe('serializeData', () => {
      it('should be an optional transform', () => {
        expectTypeOf<DehydrateOptions['serializeData']>().toEqualTypeOf<
          ((data: any) => any) | undefined
        >()
      })
    })

    describe('shouldDehydrateMutation', () => {
      it('should take a mutation and return a boolean', () => {
        expectTypeOf<
          DehydrateOptions['shouldDehydrateMutation']
        >().toEqualTypeOf<((mutation: Mutation) => boolean) | undefined>()
      })

      it('should type the mutation it receives', () => {
        dehydrate(queryClient, {
          shouldDehydrateMutation: (mutation) => {
            expectTypeOf(mutation).toEqualTypeOf<Mutation>()
            expectTypeOf(mutation.state).toEqualTypeOf<MutationState>()
            return true
          },
        })
      })

      it('should only accept a boolean from the predicate', () => {
        dehydrate(queryClient, {
          // @ts-expect-error the predicate must return a boolean
          shouldDehydrateMutation: () => 'yes',
        })

        expectTypeOf(
          dehydrate(queryClient, { shouldDehydrateMutation: () => false }),
        ).toEqualTypeOf<DehydratedState>()
      })
    })

    describe('shouldDehydrateQuery', () => {
      it('should take a query and return a boolean', () => {
        expectTypeOf<DehydrateOptions['shouldDehydrateQuery']>().toEqualTypeOf<
          ((query: Query) => boolean) | undefined
        >()
      })

      it('should type the query it receives', () => {
        dehydrate(queryClient, {
          shouldDehydrateQuery: (query) => {
            expectTypeOf(query).toEqualTypeOf<Query>()
            expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
            expectTypeOf(query.queryHash).toEqualTypeOf<string>()
            return true
          },
        })
      })

      it('should only accept a boolean from the predicate', () => {
        dehydrate(queryClient, {
          // @ts-expect-error the predicate must return a boolean
          shouldDehydrateQuery: () => 1,
        })

        expectTypeOf(
          dehydrate(queryClient, { shouldDehydrateQuery: () => true }),
        ).toEqualTypeOf<DehydratedState>()
      })
    })

    describe('shouldRedactErrors', () => {
      it('should take an unknown error and return a boolean', () => {
        expectTypeOf<DehydrateOptions['shouldRedactErrors']>().toEqualTypeOf<
          ((error: unknown) => boolean) | undefined
        >()
      })

      it('should type the error it receives as unknown', () => {
        dehydrate(queryClient, {
          shouldRedactErrors: (error) => {
            expectTypeOf(error).toEqualTypeOf<unknown>()
            return false
          },
        })
      })
    })

    it('should only expose its documented options', () => {
      expectTypeOf<keyof DehydrateOptions>().toEqualTypeOf<
        | 'serializeData'
        | 'shouldDehydrateMutation'
        | 'shouldDehydrateQuery'
        | 'shouldRedactErrors'
      >()
    })
  })

  describe('HydrateOptions', () => {
    describe('defaultOptions', () => {
      it('should be optional', () => {
        expectTypeOf<HydrateOptions>().toEqualTypeOf<{
          defaultOptions?: {
            deserializeData?: (data: any) => any
            queries?: QueryOptions
            mutations?: MutationOptions<unknown, DefaultError, unknown, unknown>
          }
        }>()
      })
    })

    describe('deserializeData', () => {
      it('should be an optional transform', () => {
        expectTypeOf<
          NonNullable<HydrateOptions['defaultOptions']>['deserializeData']
        >().toEqualTypeOf<((data: any) => any) | undefined>()
      })
    })

    describe('queries', () => {
      it('should be optional query options', () => {
        expectTypeOf<
          NonNullable<HydrateOptions['defaultOptions']>['queries']
        >().toEqualTypeOf<QueryOptions | undefined>()
      })
    })

    describe('mutations', () => {
      it('should be optional mutation options with unknown data and variables', () => {
        expectTypeOf<
          NonNullable<HydrateOptions['defaultOptions']>['mutations']
        >().toEqualTypeOf<
          MutationOptions<unknown, DefaultError, unknown, unknown> | undefined
        >()
      })
    })

    it('should reject an unknown hydrate option', () => {
      hydrate(
        queryClient,
        {},
        {
          // @ts-expect-error 'defaults' is not a hydrate option
          defaults: {},
        },
      )

      expectTypeOf(
        hydrate(queryClient, {}, { defaultOptions: { queries: {} } }),
      ).toEqualTypeOf<void>()
    })
  })

  describe('defaultShouldDehydrateQuery', () => {
    it('should take a query and return a boolean', () => {
      expectTypeOf(defaultShouldDehydrateQuery).toEqualTypeOf<
        (query: Query) => boolean
      >()
    })

    it('should be assignable to the shouldDehydrateQuery option', () => {
      expectTypeOf(
        dehydrate(queryClient, {
          shouldDehydrateQuery: defaultShouldDehydrateQuery,
        }),
      ).toEqualTypeOf<DehydratedState>()
    })

    it('should require the query', () => {
      // @ts-expect-error the query is required
      defaultShouldDehydrateQuery()

      expectTypeOf(
        defaultShouldDehydrateQuery({} as Query),
      ).toEqualTypeOf<boolean>()
    })
  })

  describe('defaultShouldDehydrateMutation', () => {
    it('should take a mutation and return a boolean', () => {
      expectTypeOf(defaultShouldDehydrateMutation).toEqualTypeOf<
        (mutation: Mutation) => boolean
      >()
    })

    it('should be assignable to the shouldDehydrateMutation option', () => {
      expectTypeOf(
        dehydrate(queryClient, {
          shouldDehydrateMutation: defaultShouldDehydrateMutation,
        }),
      ).toEqualTypeOf<DehydratedState>()
    })

    it('should require the mutation', () => {
      // @ts-expect-error the mutation is required
      defaultShouldDehydrateMutation()

      expectTypeOf(
        defaultShouldDehydrateMutation({} as Mutation),
      ).toEqualTypeOf<boolean>()
    })
  })
})
