import {
  cleanup,
  render,
  fireEvent,
} from '@testing-library/react'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { useMutation } from '../index'

describe('useMutation', () => {
  afterEach(cleanup)

  it('should be able to reset `data`', async () => {
    function Page() {
      const [mutate, mutationResult] = useMutation(() => Promise.resolve('mutation'))

      return (
        <div>
          <h1 data-testid="title">{mutationResult.data}</h1>
          <button onClick={mutationResult.reset}>reset</button>
          <button onClick={mutate}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    expect(getByTestId('title').textContent).toBe('')

    await act(async () => {
      fireEvent.click(getByText('mutate'))
    })

    expect(getByTestId('title').textContent).toBe('mutation')

    await act(async () => {
      fireEvent.click(getByText('reset'))
    })

    expect(getByTestId('title').textContent).toBe('')
  })
})
