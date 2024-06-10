import { Temporal } from '@js-temporal/polyfill'
import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query'
import { createTson } from 'tupleson'
import type { TsonType } from 'tupleson'

const plainDate = {
  deserialize: (v) => Temporal.PlainDate.from(v),
  key: 'PlainDate',
  serialize: (v) => v.toJSON(),
  test: (v) => v instanceof Temporal.PlainDate,
} satisfies TsonType<Temporal.PlainDate, string>

export const tson = createTson({
  types: [plainDate],
})

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      hydrate: {
        // transformPromise: async (promise) => {
        //   const result = await promise
        //   return tson.deserialize(result)
        // },
        transformPromise: (p) => p.then(tson.deserialize),
      },
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  })
}
