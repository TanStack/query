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
