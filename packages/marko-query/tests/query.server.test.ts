import { describe, expect, it } from 'vitest'
import { QueryClient, dehydrate, getQueryClient } from '@tanstack/marko-query'
import Boundary from './fixtures/server-boundary.marko'
import Queries from './fixtures/server-queries.marko'
import Template from './fixtures/server-query.marko'

const render = (input: { queryKey: Array<unknown>; $global: Marko.Global }) =>
  Promise.resolve(Template.render(input)).then(String)

describe('<query> on the server', () => {
  it('renders prefetched data and sends it to the browser', async () => {
    const $global: Marko.Global = {}
    await getQueryClient($global).query({
      queryKey: ['user'],
      queryFn: () => 'Ada',
    })
    const html = await render({ queryKey: ['user'], $global })
    expect(html).toMatch(/<p id=status>success</)
    expect(html).toMatch(/<p id=data>Ada</)
    expect(html).toContain('dehydratedQueryState:{')
    expect(html).toContain('snapshot_hydration:{')
  })

  it('does not fetch on its own', async () => {
    const $global: Marko.Global = {}
    const html = await render({ queryKey: ['nothing'], $global })
    expect(html).toMatch(/<p id=status>pending</)
    expect(html).not.toContain('snapshot_hydration')
    const query = getQueryClient($global)
      .getQueryCache()
      .find({ queryKey: ['nothing'] })
    expect(query?.state.fetchStatus ?? 'idle').toBe('idle')
  })
})

describe('<hydration-boundary> on the server', () => {
  it('hydrates the request client before its content renders', async () => {
    const source = new QueryClient()
    source.setQueryData(['boundary'], 'from loader')
    const $global: Marko.Global = {}
    const client = getQueryClient($global)
    const html = await Promise.resolve(
      Boundary.render({ state: dehydrate(source), $global }),
    ).then(String)
    expect(html).toMatch(/<p id=data>from loader</)
    expect(client.getQueryData(['boundary'])).toBe('from loader')
  })
})

describe('<queries> on the server', () => {
  it('combine runs during render; its output is what the browser receives', async () => {
    const $global: Marko.Global = {}
    const client = getQueryClient($global)
    client.setQueryData(['a'], 1)
    client.setQueryData(['b'], 2)
    const html = await Promise.resolve(Queries.render({ $global })).then(String)
    expect(html).toMatch(/<p id=total>3</)
  })
})
