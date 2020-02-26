import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'

import { setConsole, useMutation } from '../index'

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
