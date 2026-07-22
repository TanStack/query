import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mountDifferential } from './_rig'

const directory = dirname(fileURLToPath(import.meta.url))
const cachedFixture = resolve(directory, '../_fixtures/cached-diff.tsrx')
const asyncFixture = resolve(directory, '../_fixtures/async-diff.tsrx')
const settle = () =>
  new Promise<void>((timerResolve) => setTimeout(timerResolve, 40))

describe('Octane and React Query differential parity', () => {
  it('renders the same initialData result shape', async () => {
    expect.hasAssertions()
    const pair = await mountDifferential(cachedFixture, 'CachedApp')
    await pair.step('mount', () => {})
    pair.unmount()
  })

  it('renders the same pending and success query states', async () => {
    expect.hasAssertions()
    const pair = await mountDifferential(asyncFixture, 'AsyncApp')
    await pair.step('pending', () => {})
    await pair.step('success', settle)
    pair.unmount()
  })

  it('renders the same idle, pending, and success mutation states', async () => {
    expect.hasAssertions()
    const pair = await mountDifferential(asyncFixture, 'MutationApp')
    await pair.step('idle', () => {})
    await pair.step('pending', async (octane, react) => {
      await octane.click('#go')
      await react.click('#go')
    })
    await pair.step('success', settle)
    pair.unmount()
  })
})
