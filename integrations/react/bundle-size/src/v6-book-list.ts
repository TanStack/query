export { useQuery as useBookQuery } from '#adapter'

export const isPending = <T extends { isPending: boolean }>(
  result: T,
): result is T & { isPending: true } => result.isPending
export const isError = <T extends { isError: boolean }>(
  result: T,
): result is T & { isError: true } => result.isError
