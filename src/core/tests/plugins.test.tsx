import { mockConsoleError, queryKey } from '../../react/tests/utils'
import { QueryCache, QueryClient } from '../..'

describe('plugins', () => {
  describe('onQuery', () => {
    test('should be able to log a query', async () => {
      const logs: unknown[][] = []
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async (context, next) => {
              logs.push(context.params)
              return next()
            },
          },
        ],
      })
      const key = queryKey()
      await client.fetchQueryData(key, () => key)
      expect(logs).toEqual([[key]])
    })

    test('should be able to log a query result', async () => {
      const logs: unknown[] = []
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async (_, next) => {
              const result = await next()
              logs.push(result)
              return result
            },
          },
        ],
      })
      const key = queryKey()
      await client.fetchQueryData(key, () => key)
      expect(logs).toEqual([key])
    })

    test('should be able to log a query error', async () => {
      const consoleMock = mockConsoleError()
      const logs: unknown[][] = []
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async (_, next) => {
              try {
                return await next()
              } catch (error) {
                logs.push(error)
                throw error
              }
            },
          },
        ],
      })
      const key = queryKey()
      try {
        await client.fetchQueryData(key, () => {
          throw new Error('oops')
        })
      } catch {}
      expect(logs).toEqual([new Error('oops')])
      consoleMock.mockRestore()
    })

    test('should be able to change query params', async () => {
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async (context, next) => {
              context.params = ['new']
              return next()
            },
          },
        ],
      })
      const key = queryKey()
      const data = await client.fetchQueryData(key, param1 => param1)
      expect(data).toEqual('new')
    })

    test('should be able to short circuit with a result', async () => {
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async () => {
              return 'different'
            },
          },
        ],
      })
      const key = queryKey()
      const data = await client.fetchQueryData(key, param1 => param1)
      expect(data).toEqual('different')
    })

    test('should be able to short circuit with an error', async () => {
      const consoleMock = mockConsoleError()
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: () => {
              throw new Error('different')
            },
          },
        ],
      })
      const key = queryKey()
      let error
      try {
        await client.fetchQueryData(key, param1 => param1)
      } catch (err) {
        error = err
      }
      expect(error).toEqual(new Error('different'))
      consoleMock.mockRestore()
    })

    test('should be able to chain middleware', async () => {
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onQuery: async (context, next) => {
              context.params = [...context.params, 1]
              return next()
            },
          },
          {
            onQuery: async (context, next) => {
              context.params = [...context.params, 2]
              return next()
            },
          },
        ],
      })
      const key = queryKey()
      const data = await client.fetchQueryData(
        key,
        (...params: any[]) => params
      )
      expect(data).toEqual([key, 1, 2])
    })
  })

  describe('onMutate', () => {
    test('should be able to log a mutation', async () => {
      const logs: unknown[] = []
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onMutate: async (context, next) => {
              logs.push(context.variables)
              return next()
            },
          },
        ],
      })
      await client.mutate((todo: string) => todo, 'todo')
      expect(logs).toEqual(['todo'])
    })

    test('should be able to log a mutation result', async () => {
      const logs: unknown[] = []
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onMutate: async (_, next) => {
              const result = await next()
              logs.push(result)
              return result
            },
          },
        ],
      })
      await client.mutate((_: string) => 'result', 'todo')
      expect(logs).toEqual(['result'])
    })

    test('should be able to change the result', async () => {
      const cache = new QueryCache()
      const client = new QueryClient({
        cache,
        plugins: [
          {
            onMutate: async (_, next) => {
              const result = await next()
              return Promise.resolve(result + 'Adjusted')
            },
          },
        ],
      })
      const result = await client.mutate((_: string) => 'result', 'todo')
      expect(result).toEqual('resultAdjusted')
    })
  })
})
