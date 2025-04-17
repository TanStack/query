import { beforeAll, describe, expect, test, vi } from 'vitest'
import { ref } from 'vue-demi'
import { QueryCache as QueryCacheOrigin } from '@tanstack/query-core'
import { QueryCache } from '../queryCache'

describe('QueryCache', () => {
  beforeAll(() => {
    vi.spyOn(QueryCacheOrigin.prototype, 'find')
    vi.spyOn(QueryCacheOrigin.prototype, 'findAll')
  })

  describe('find', () => {
    test('should properly unwrap parameters', () => {
      const queryCache = new QueryCache()

      queryCache.find({
        queryKey: ['foo', ref('bar')],
      })

      expect(QueryCacheOrigin.prototype.find).toBeCalledWith({
        queryKey: ['foo', 'bar'],
      })
    })
  })

  describe('findAll', () => {
    test('should properly unwrap two parameters', () => {
      const queryCache = new QueryCache()

      queryCache.findAll({
        queryKey: ['foo', ref('bar')],
      })

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({
        queryKey: ['foo', 'bar'],
      })
    })

    test('should default to empty filters', () => {
      const queryCache = new QueryCache()

      queryCache.findAll()

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({})
    })
  })
})
