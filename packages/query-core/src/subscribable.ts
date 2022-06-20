type Listener = () => void

export class Subscribable<TListener extends Function = Listener> {
  protected listeners: TListener[]

  constructor() {
    this.listeners = []
    this.subscribe = this.subscribe.bind(this)
  }

  subscribe(listener: TListener): () => void {
    this.listeners.push(listener as TListener)

    this.onSubscribe()

    return () => {
      this.listeners = this.listeners.filter((x) => x !== listener)
      this.onUnsubscribe()
    }
  }

  hasListeners(): boolean {
    return this.listeners.length > 0
  }

  protected onSubscribe(): void {
    // Do nothing
  }

  protected onUnsubscribe(): void {
    // Do nothing
  }
}
