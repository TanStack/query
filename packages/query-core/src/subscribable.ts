type Listener = () => void

export class Subscribable<TListener extends Function = Listener> {
  protected listeners: Set<{ listener: TListener }>

  constructor() {
    this.listeners = new Set()
    this.subscribe = this.subscribe.bind(this)
  }

  subscribe(listener: TListener): () => void {
    const identity = { listener }
    this.listeners.add(identity)

    this.onSubscribe()

    return () => {
      this.listeners.delete(identity)
      this.onUnsubscribe()
    }
  }

  hasListeners(): boolean {
    return this.listeners.size > 0
  }

  protected onSubscribe(): void {
    // Do nothing
  }

  protected onUnsubscribe(): void {
    // Do nothing
  }
}
