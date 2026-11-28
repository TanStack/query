import * as core from '@tanstack/query-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { QueryCache, findCachedQueries, findCachedQuery } from '../queryCache'

describe('QueryCache', () => {
  beforeEach(() => {
    vi.spyOn(core, 'findCachedQuery')
    vi.spyOn(core, 'findCachedQueries')
  })

  describe('find', () => {
    it('should properly unwrap parameters', () => {
      const queryCache = new QueryCache()

      findCachedQuery(queryCache, {
        queryKey: ['foo', ref('bar')],
      })

      expect(core.findCachedQuery).toHaveBeenCalledWith(queryCache, {
        queryKey: ['foo', 'bar'],
      })
    })
  })

  describe('findAll', () => {
    it('should properly unwrap two parameters', () => {
      const queryCache = new QueryCache()

      findCachedQueries(queryCache, {
        queryKey: ['foo', ref('bar')],
      })

      expect(core.findCachedQueries).toHaveBeenCalledWith(queryCache, {
        queryKey: ['foo', 'bar'],
      })
    })

    it('should default to empty filters', () => {
      const queryCache = new QueryCache()

      findCachedQueries(queryCache)

      expect(core.findCachedQueries).toHaveBeenCalledWith(queryCache, {})
    })
  })
})
