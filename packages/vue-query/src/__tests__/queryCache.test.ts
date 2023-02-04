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

      queryCache.find({
        queryKey: ['foo', ref('bar')],
      })

      expect(QueryCacheOrigin.prototype.find).toBeCalledWith({
        queryKey: ['foo', 'bar'],
        exact: true, //Exact is true, as `find` in QueryCacheOrigin sets exact to true in the passed filters if exact is undefined
      })
    })
  })

  describe('findAll', () => {
    test('should properly unwrap two parameters', async () => {
      const queryCache = new QueryCache()

      queryCache.findAll({
        queryKey: ['foo', ref('bar')],
      })

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({
        queryKey: ['foo', 'bar'],
      })
    })

    test('should default to empty filters', async () => {
      const queryCache = new QueryCache()

      queryCache.findAll()

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({})
    })
  })
})
