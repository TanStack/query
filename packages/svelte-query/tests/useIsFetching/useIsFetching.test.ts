import { describe, test } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('useIsFetching', () => {
  test('should update as queries start and stop fetching', async () => {
    const rendered = render(BaseExample)

    await rendered.findByText('isFetching: 0')
    fireEvent.click(rendered.getByRole('button', { name: /setReady/i }))

    waitFor(async () => {
      await rendered.findByText('isFetching: 1')
      await rendered.findByText('isFetching: 0')
    })
  })
})
