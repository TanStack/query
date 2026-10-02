import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LitElement } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { BaseController } from '../controllers/BaseController.js'
import { generateElementName } from './utils.js'
import type { ReactiveControllerHost } from 'lit'

const providerTagName = generateElementName()
customElements.define(providerTagName, QueryClientProvider)

class RecordingController extends BaseController<string> {
  readonly lifecycle: Array<string> = []

  constructor(host: ReactiveControllerHost) {
    super(host, 'pending')
  }

  protected onConnected(): void {
    this.lifecycle.push(
      `connected:${this.tryGetQueryClient() ? 'client' : 'missing'}`,
    )
  }

  protected onDisconnected(): void {}

  protected onHostUpdate(): void {}

  protected onQueryClientChanged(): void {
    this.lifecycle.push(
      `changed:${this.tryGetQueryClient() ? 'client' : 'missing'}`,
    )
  }
}

describe('BaseController', () => {
  let queryClient: QueryClient
  let container: HTMLElement

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    container = document.createElement('div')
    document.body.append(container)
  })

  afterEach(() => {
    container.remove()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should defer provider resolution on already-connected hosts until after onConnected', async () => {
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = queryClient

    class Host extends LitElement {}
    customElements.define(generateElementName(), Host)
    const host = new Host()
    provider.append(host)

    container.append(provider)
    await provider.updateComplete
    await host.updateComplete

    const controller = new RecordingController(host)
    await vi.advanceTimersByTimeAsync(0)
    expect(controller.lifecycle).toEqual([
      'connected:missing',
      'changed:client',
    ])

    controller.destroy()
    provider.remove()
  })

  it('should resolve to a missing client without throwing when the host cannot dispatch events', async () => {
    const host: ReactiveControllerHost = {
      addController: () => {},
      removeController: () => {},
      requestUpdate: () => {},
      updateComplete: Promise.resolve(true),
    }

    const controller = new RecordingController(host)
    controller.hostConnected()
    await vi.advanceTimersByTimeAsync(0)
    expect(controller.lifecycle).toEqual([
      'connected:missing',
      'changed:missing',
    ])
    expect(() => controller.current).toThrow(
      'No QueryClient available. Pass one explicitly or render within QueryClientProvider.',
    )

    controller.destroy()
  })
})
