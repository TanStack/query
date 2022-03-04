import { CompatWeakRef, isValidTimeout } from './utils'

export abstract class Removable {
  cacheTime!: number
  private gcTimeout?: ReturnType<typeof setTimeout>

  destroy(): void {
    this.clearGcTimeout()
  }

  protected scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.cacheTime)) {
      const thisRef = new CompatWeakRef(this)

      this.gcTimeout = setTimeout(() => {
        thisRef.deref()?.optionalRemove()
      }, this.cacheTime)
    }
  }

  protected updateCacheTime(newCacheTime: number | undefined): void {
    // Default to 5 minutes if no cache time is set
    this.cacheTime = Math.max(
      this.cacheTime || 0,
      newCacheTime ?? 5 * 60 * 1000
    )
  }

  protected clearGcTimeout() {
    clearTimeout(this.gcTimeout!)
    this.gcTimeout = undefined
  }

  protected abstract optionalRemove(): void
}
