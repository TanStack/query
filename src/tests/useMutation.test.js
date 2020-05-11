import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'

import { useMutation } from '../index'

describe('useMutation', () => {
  afterEach(cleanup)

  it('should be able to reset `data`', async () => {
    function Page() {
      const [mutate, { data = '', reset }] = useMutation(() =>
        Promise.resolve('mutation')
      )

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={reset}>reset</button>
          <button onClick={mutate}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    expect(getByTestId('title').textContent).toBe('')

    fireEvent.click(getByText('mutate'))

    await waitForElement(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('mutation')

    fireEvent.click(getByText('reset'))

    await waitForElement(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('')
  })

  it('should be able to reset `error`', async () => {
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})

    function Page() {
      const [mutate, mutationResult] = useMutation(
        () => {
          const error = new Error('Expected mock error. All is well!')
          error.stack = ''
          return Promise.reject(error)
        },
        {
          throwOnError: false,
        }
      )

      return (
        <div>
          {mutationResult.error && (
            <h1 data-testid="error">{mutationResult.error.message}</h1>
          )}
          <button onClick={mutationResult.reset}>reset</button>
          <button onClick={mutate}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText, queryByTestId } = render(<Page />)

    expect(queryByTestId('error')).toBeNull()

    fireEvent.click(getByText('mutate'))

    await waitForElement(() => getByTestId('error'))

    expect(getByTestId('error').textContent).toBe(
      'Expected mock error. All is well!'
    )

    fireEvent.click(getByText('reset'))

    expect(queryByTestId('error')).toBeNull()

    console.error.mockRestore()
  })
})
