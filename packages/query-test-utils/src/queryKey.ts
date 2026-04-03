let queryKeyCount = 0

export const queryKey = (): Array<string> => {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}
