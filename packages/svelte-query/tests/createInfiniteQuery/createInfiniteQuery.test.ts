import { describe, test } from 'vitest'
import { render } from '@testing-library/svelte'

import { sleep } from '../utils'
import BaseExample from './BaseExample.svelte'

describe('createQuery', () => {
  test('Render and wait for success', async () => {
    const rendered = render(BaseExample)

    await rendered.findByText('Data: undefined')
    await rendered.findByText('Status: pending')

    await sleep(20)

    await rendered.findByText('Data: {"pages":[0],"pageParams":[0]}')
    await rendered.findByText('Status: success')
  })
})
