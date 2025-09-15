export type StatusResult<T = unknown> = {
  status: string
  fetchStatus: string
  data: T | undefined
}
