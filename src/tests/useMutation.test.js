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
})
