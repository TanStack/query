import { isServer, isValidTimeout } from './utils'

export abstract class Removable {
  cacheTime!: number
  private gcTimeout?: ReturnType<typeof setTimeout>

  destroy(): void {
    this.clearGcTimeout()
  }

  protected scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.cacheTime)) {
      this.gcTimeout = setTimeout(() => {
        this.optionalRemove()
      }, this.cacheTime)
    }
  }

  protected updateCacheTime(newCacheTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no cache time is set
    this.cacheTime = Math.max(
      this.cacheTime || 0,
      newCacheTime ?? (isServer ? Infinity : 5 * 60 * 1000),
    )
  }

  protected clearGcTimeout() {
    if (this.gcTimeout) {
      clearTimeout(this.gcTimeout)
      this.gcTimeout = undefined
    }
  }

  protected abstract optionalRemove(): void
}
