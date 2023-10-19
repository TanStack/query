import { describe, expect, it } from 'vitest'
import { getIsRestoringContext } from '../context'

describe('getIsRestoringContext', () => {
    it('Should not throw when called outside of a component', async () => {
        expect(() => getIsRestoringContext()).to.not.throw()
    })
})
