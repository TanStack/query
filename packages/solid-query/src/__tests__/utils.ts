let queryKeyCount = 0
export function queryKey(): () => Array<string> {
  const localQueryKeyCount = queryKeyCount++
  return () => [`query_${localQueryKeyCount}`]
}
