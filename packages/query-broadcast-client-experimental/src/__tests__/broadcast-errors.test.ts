import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { broadcastQueryClient } from '..'

const { postMessage } = vi.hoisted(() => ({
  postMessage: vi.fn<(message: unknown) => Promise<void>>(),
}))

vi.mock('broadcast-channel', () => ({
  BroadcastChannel: class {
    onmessage: ((message: unknown) => void) | null = null
    postMessage = postMessage
    close = vi.fn()
  },
}))

describe('broadcastQueryClient - non-serializable data', () => {
  let queryClient: QueryClient
  let cleanup: () => void

  beforeEach(() => {
    postMessage.mockReset()
    postMessage.mockResolvedValue(undefined)
    queryClient = new QueryClient()
    cleanup = broadcastQueryClient({
      queryClient,
      broadcastChannel: 'test_channel',
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  it('does not surface an unhandled rejection when postMessage fails', async () => {
    const unhandledRejection = vi.fn()
    process.on('unhandledRejection', unhandledRejection)

    postMessage.mockRejectedValueOnce(
      new DOMException('data could not be cloned', 'DataCloneError'),
    )

    queryClient.setQueryData(['key'], 'value')

    expect(postMessage).toHaveBeenCalled()

    // Let any (un)handled rejection flush through the event loop.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(unhandledRejection).not.toHaveBeenCalled()
    process.off('unhandledRejection', unhandledRejection)
  })

  it('warns in development when broadcasting fails', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    postMessage.mockRejectedValueOnce(
      new DOMException('data could not be cloned', 'DataCloneError'),
    )

    queryClient.setQueryData(['key'], 'value')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to broadcast query'),
      expect.any(DOMException),
    )

    consoleWarn.mockRestore()
  })

  it('stays silent in production when broadcasting fails', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    postMessage.mockRejectedValueOnce(
      new DOMException('data could not be cloned', 'DataCloneError'),
    )

    queryClient.setQueryData(['key'], 'value')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(consoleWarn).not.toHaveBeenCalled()

    consoleWarn.mockRestore()
  })
})
