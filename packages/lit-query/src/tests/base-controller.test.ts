import { describe, expect, it } from 'vitest'
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider } from '../QueryClientProvider.js'
import { BaseController } from '../controllers/BaseController.js'

const providerTagName = 'test-query-client-provider-base-controller'
if (!customElements.get(providerTagName)) {
  customElements.define(providerTagName, QueryClientProvider)
}

class RecordingController extends BaseController<string> {
  readonly lifecycle: string[] = []

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

class AlreadyConnectedContextHost
  extends HTMLElement
  implements ReactiveControllerHost
{
  private readonly controllers = new Set<ReactiveController>()

  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
    if (this.isConnected) {
      controller.hostConnected?.()
    }
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller)
  }

  requestUpdate(): void {
    this.updatesRequested += 1
  }

  connectedCallback(): void {
    for (const controller of this.controllers) {
      controller.hostConnected?.()
    }
  }

  disconnectedCallback(): void {
    for (const controller of this.controllers) {
      controller.hostDisconnected?.()
    }
  }

  attachController(): RecordingController {
    return new RecordingController(this)
  }
}

const hostTagName = 'test-base-controller-context-host'
if (!customElements.get(hostTagName)) {
  customElements.define(hostTagName, AlreadyConnectedContextHost)
}

describe('BaseController', () => {
  it('defers provider resolution on already-connected hosts until after onConnected', async () => {
    const client = new QueryClient()
    const provider = document.createElement(
      providerTagName,
    ) as QueryClientProvider
    provider.client = client

    const host = document.createElement(
      hostTagName,
    ) as AlreadyConnectedContextHost
    provider.append(host)

    document.body.append(provider)
    await provider.updateComplete

    const controller = host.attachController()
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.lifecycle).toEqual([
      'connected:missing',
      'changed:client',
    ])

    controller.destroy()
    provider.remove()
    await Promise.resolve()
  })
})
