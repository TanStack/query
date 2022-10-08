import { ref } from 'vue-demi'
import { MutationCache as MutationCacheOrigin } from '@tanstack/query-core'

import { MutationCache } from '../mutationCache'

describe('MutationCache', () => {
  beforeAll(() => {
    jest.spyOn(MutationCacheOrigin.prototype, 'find')
    jest.spyOn(MutationCacheOrigin.prototype, 'findAll')
  })

  describe('find', () => {
    test('should properly unwrap parameters', async () => {
      const mutationCache = new MutationCache()

      mutationCache.find({
        mutationKey: ref(['baz']),
      })

      expect(MutationCacheOrigin.prototype.find).toBeCalledWith({
        exact: true,
        mutationKey: ['baz'],
      })
    })
  })

  describe('findAll', () => {
    test('should properly unwrap parameters', async () => {
      const mutationCache = new MutationCache()

      mutationCache.findAll({
        mutationKey: ref(['baz']),
      })

      expect(MutationCacheOrigin.prototype.findAll).toBeCalledWith({
        mutationKey: ['baz'],
      })
    })
  })
})
