import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue-demi'
import { QueryCache as QueryCacheOrigin } from '@tanstack/query-core'
import { QueryCache } from '../queryCache'

describe('QueryCache', () => {
  beforeAll(() => {
    vi.spyOn(QueryCacheOrigin.prototype, 'find')
    vi.spyOn(QueryCacheOrigin.prototype, 'findAll')
  })

  describe('find', () => {
    it('should properly unwrap parameters', () => {
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
    it('should properly unwrap two parameters', () => {
      const queryCache = new QueryCache()

      queryCache.findAll({
        queryKey: ['foo', ref('bar')],
      })

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({
        queryKey: ['foo', 'bar'],
      })
    })

    it('should default to empty filters', () => {
      const queryCache = new QueryCache()

      queryCache.findAll()

      expect(QueryCacheOrigin.prototype.findAll).toBeCalledWith({})
    })
  })
})
