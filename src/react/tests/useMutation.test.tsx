import { render, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'

import { useMutation } from '../..'
import { mockConsoleError } from './utils'

describe('useMutation', () => {
  it('should be able to reset `data`', async () => {
    function Page() {
      const [mutate, { data = '', reset }] = useMutation(() =>
        Promise.resolve('mutation')
      )

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
          <button onClick={() => reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    expect(getByTestId('title').textContent).toBe('')

    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('mutation')

    fireEvent.click(getByText('reset'))

    await waitFor(() => getByTestId('title'))

    expect(getByTestId('title').textContent).toBe('')
  })

  it('should be able to reset `error`', async () => {
    const consoleMock = mockConsoleError()

    function Page() {
      const [mutate, mutationResult] = useMutation<string, Error>(
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
          <button onClick={() => mutationResult.reset()}>reset</button>
          <button onClick={() => mutate()}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText, queryByTestId } = render(<Page />)

    expect(queryByTestId('error')).toBeNull()

    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('error'))

    expect(getByTestId('error').textContent).toBe(
      'Expected mock error. All is well!'
    )

    fireEvent.click(getByText('reset'))

    expect(queryByTestId('error')).toBeNull()

    consoleMock.mockRestore()
  })

  it('should be able to call `onSuccess` and `onSettled` after each successful mutate', async () => {
    let count = 0
    const onSuccessMock = jest.fn()
    const onSettledMock = jest.fn()

    function Page() {
      const [mutate] = useMutation(
        async (vars: { count: number }) => Promise.resolve(vars.count),
        {
          onSuccess: data => onSuccessMock(data),
          onSettled: data => onSettledMock(data),
        }
      )

      return (
        <div>
          <h1 data-testid="title">{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    expect(getByTestId('title').textContent).toBe('0')

    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(onSuccessMock).toHaveBeenCalledTimes(3)
    expect(onSuccessMock).toHaveBeenCalledWith(1)
    expect(onSuccessMock).toHaveBeenCalledWith(2)
    expect(onSuccessMock).toHaveBeenCalledWith(3)

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenCalledWith(1)
    expect(onSettledMock).toHaveBeenCalledWith(2)
    expect(onSettledMock).toHaveBeenCalledWith(3)

    expect(getByTestId('title').textContent).toBe('3')
  })

  it('should be able to call `onError` and `onSettled` after each failed mutate', async () => {
    const consoleMock = mockConsoleError()

    const onErrorMock = jest.fn()
    const onSettledMock = jest.fn()
    let count = 0

    function Page() {
      const [mutate] = useMutation(
        (vars: { count: number }) => {
          const error = new Error(
            `Expected mock error. All is well! ${vars.count}`
          )
          error.stack = ''
          return Promise.reject(error)
        },
        {
          onError: (error: Error) => onErrorMock(error.message),
          onSettled: (_data, error) => onSettledMock(error?.message),
          throwOnError: false,
        }
      )

      return (
        <div>
          <h1 data-testid="title">{count}</h1>
          <button onClick={() => mutate({ count: ++count })}>mutate</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    expect(getByTestId('title').textContent).toBe('0')

    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))
    fireEvent.click(getByText('mutate'))

    await waitFor(() => getByTestId('title'))

    expect(onErrorMock).toHaveBeenCalledTimes(3)
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1'
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2'
    )
    expect(onErrorMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3'
    )

    expect(onSettledMock).toHaveBeenCalledTimes(3)
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 1'
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 2'
    )
    expect(onSettledMock).toHaveBeenCalledWith(
      'Expected mock error. All is well! 3'
    )

    expect(getByTestId('title').textContent).toBe('3')

    consoleMock.mockRestore()
  })
})
