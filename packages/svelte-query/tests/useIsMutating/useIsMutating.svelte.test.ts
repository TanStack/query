import { describe, test } from 'vitest'
import { fireEvent, render } from '@testing-library/svelte'
import BaseExample from './BaseExample.svelte'

describe('useIsFetching', () => {
  test('should update as queries start and stop fetching', async () => {
    const rendered = render(BaseExample)

    await rendered.findByText('isMutating: 0')
    fireEvent.click(rendered.getByRole('button', { name: /Trigger/i }))
    await rendered.findByText('isMutating: 1')
    await rendered.findByText('isMutating: 0')
  })
})
