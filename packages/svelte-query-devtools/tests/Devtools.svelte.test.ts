import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/svelte'
import { QueryClient } from '@tanstack/svelte-query'
import SvelteQueryDevtools from '../src/Devtools.svelte'
import Wrapper from './Wrapper.svelte'

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

  it('should throw an error if no query client has been set', () => {
    expect(() => render(SvelteQueryDevtools)).toThrow(
      'No QueryClient was found in Svelte context. Did you forget to wrap your component with QueryClientProvider?',
    )
  })

  it('should not throw an error if query client is provided via context', () => {
    const queryClient = new QueryClient()

    expect(() => render(Wrapper, { props: { queryClient } })).not.toThrow()
  })

  it('should not throw an error if query client is provided via props', () => {
    const queryClient = new QueryClient()

    expect(() =>
      render(SvelteQueryDevtools, { props: { client: queryClient } }),
    ).not.toThrow()
  })
})
