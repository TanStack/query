import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'

import { setConsole, useMutation } from '../index'
import { deepEqual } from '../utils'

describe('setConsole', () => {
  afterEach(cleanup)

  it('should override Console object', async () => {
    const mockConsole = {
      error: jest.fn(),
    }

    setConsole(mockConsole)

    function Page() {
      const [mutate, { error }] = useMutation(() => {
        throw new Error('Expected mock error. All is well!')
      })

      return (
        <div>
          {error && <h1 data-testid="error">{error.message}</h1>}
          <button onClick={mutate}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    fireEvent.click(getByText('mutate'))

    await waitForElement(() => getByTestId('error'))

    expect(mockConsole.error).toHaveBeenCalled()

    setConsole(console)
  })
})

describe('deepEqual', () => {
  it('should return `false` for different dates', () => {
    const date1 = new Date(2020, 3, 1)
    const date2 = new Date(2020, 3, 2)

    expect(deepEqual(date1, date2)).toEqual(false)
  })

  it('should return `true` for equal dates', () => {
    const date1 = new Date(2020, 3, 1)
    const date2 = new Date(2020, 3, 1)

    expect(deepEqual(date1, date2)).toEqual(true)
  })
})
