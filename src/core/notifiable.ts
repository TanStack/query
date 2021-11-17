import { Subscribable } from './subscribable'
import { notifyManager } from '../core/notifyManager'

export class Notifiable<TEvent> extends Subscribable<(event: TEvent) => void> {
  notify(event: TEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(event)
      })
    })
  }
}
