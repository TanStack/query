import React from 'react'
import { render } from '@testing-library/react'

import { useIsMounted } from '../utils'

function setup() {
  let isMounted = () => false
  function TestComponent() {
    isMounted = useIsMounted()
    return null
  }
  const { unmount } = render(<TestComponent />)
  return { isMounted, unmount }
}

describe('react/utils', () => {
  describe('useIsMounted', () => {
    it('isMounted should return true when component mounted', () => {
      const { isMounted } = setup()
      expect(isMounted()).toBe(true)
    })

    it('isMounted should return false when component is not mounted', () => {
      const { isMounted, unmount } = setup()
      unmount()
      expect(isMounted()).toBe(false)
    })
  })
})
