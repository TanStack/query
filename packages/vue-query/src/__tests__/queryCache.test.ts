import { ref } from 'vue-demi'
import { QueryCache as QueryCacheOrigin } from '@tanstack/query-core'

import { QueryCache } from '../queryCache'

describe('QueryCache', () => {
  beforeAll(() => {
    jest.spyOn(QueryCacheOrigin.prototype, 'find')
    jest.spyOn(QueryCacheOrigin.prototype, 'findAll')
  })

  describe('find', () => {
    test('should properly unwrap parameters', async () => {
      const queryCache = new QueryCache()

      queryCache.find(['foo', ref('bar')], {
        queryKey: ref(['baz']),
      })

      expect(QueryCacheOrigin.prototype.find).toBeCalledWith(['foo', 'bar'], {
        queryKey: ['baz'],
      })
    })
  })

  describe('findAll', () => {
    test('should properly unwrap two parameters', async () => {
      const queryCache = new QueryCache()

      queryCache.findAll(['foo', ref('bar')], {
        queryKey: ref(['baz']),
      })

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith(
        ['foo', 'bar'],
        {
          queryKey: ['baz'],
        },
      )
    })

    test('should properly unwrap one parameter', async () => {
      const queryCache = new QueryCache()

      queryCache.findAll({
        queryKey: ref(['baz']),
      })

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({
        queryKey: ['baz'],
      })
    })
  })
})
