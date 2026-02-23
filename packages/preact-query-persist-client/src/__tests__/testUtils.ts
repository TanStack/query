let queryKeyCount = 0

export const queryKey = (): Array<string> => {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
