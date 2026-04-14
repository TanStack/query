import type { ReactiveController, ReactiveControllerHost } from 'lit'

export class TestControllerHost implements ReactiveControllerHost {
  private readonly controllers = new Set<ReactiveController>()
  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller)
  }

  requestUpdate(): void {
    this.updatesRequested += 1
  }

  connect(): void {
    for (const controller of this.controllers) {
      controller.hostConnected?.()
    }
  }

  disconnect(): void {
    for (const controller of this.controllers) {
      controller.hostDisconnected?.()
    }
  }

  update(): void {
    for (const controller of this.controllers) {
      controller.hostUpdate?.()
    }

    for (const controller of this.controllers) {
      controller.hostUpdated?.()
    }
  }
}

export class TestElementHost
  extends HTMLElement
  implements ReactiveControllerHost
{
  protected readonly controllers = new Set<ReactiveController>()
  updatesRequested = 0
  readonly updateComplete: Promise<boolean> = Promise.resolve(true)

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
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

  flushHostUpdate(): void {
    for (const controller of this.controllers) {
      controller.hostUpdate?.()
    }

    for (const controller of this.controllers) {
      controller.hostUpdated?.()
    }
  }
}

export async function waitFor(
  assertion: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const startedAt = Date.now()
  while (!assertion()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for assertion after ${timeoutMs}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

function isMissingQueryClientError(error: unknown): boolean {
  return (
    error instanceof Error && /No QueryClient available/.test(error.message)
  )
}

export async function waitForMissingQueryClient(
  read: () => unknown,
  timeoutMs = 2000,
): Promise<void> {
  await waitFor(() => {
    try {
      read()
      return false
    } catch (error) {
      return isMissingQueryClientError(error)
    }
  }, timeoutMs)
}
