export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}

export class StatelessRef<T> {
  current: T
  constructor(value: T) {
    this.current = value
  }
}
