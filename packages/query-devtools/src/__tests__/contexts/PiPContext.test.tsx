import { describe, expect, it } from 'vitest'
import { render } from '@solidjs/testing-library'
import { usePiPWindow } from '../../contexts'

describe('PiPContext', () => {
  describe('usePiPWindow', () => {
    it('should throw when used outside a "PiPProvider"', () => {
      function PiPProbe() {
        usePiPWindow()
        return null
      }

      expect(() => render(() => <PiPProbe />)).toThrow(
        'usePiPWindow must be used within a PiPProvider',
      )
    })
  })
})
