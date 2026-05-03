import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/svelte-query'
import SvelteQueryDevtools from '../src/Devtools.svelte'

describe('SvelteQueryDevtools', () => {
  it('should render the parent container without throwing in non-development environments', () => {
    const queryClient = new QueryClient()

    const { container } = render(SvelteQueryDevtools, {
      props: { client: queryClient },
    })

    expect(
      container.querySelector('.tsqd-parent-container'),
    ).toBeInTheDocument()
  })
})
