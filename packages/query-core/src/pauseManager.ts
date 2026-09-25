import { Subscribable } from './subscribable'

type Listener = (paused: boolean) => void

export class PauseManager extends Subscribable<Listener> {
  #paused: boolean

  constructor(paused = false) {
    super()
    this.#paused = paused
  }

  #onChange(): void {
    const isPaused = this.isPaused()
    this.listeners.forEach((listener) => {
      listener(isPaused)
    })
  }

  setPaused(paused: boolean): void {
    const changed = this.#paused !== paused
    if (changed) {
      this.#paused = paused
      this.#onChange()
    }
  }

  isPaused(): boolean {
    return this.#paused
  }
}
