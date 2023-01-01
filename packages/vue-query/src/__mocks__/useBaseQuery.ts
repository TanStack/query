const { useBaseQuery: originImpl, unrefQueryArgs: originalParse } =
  jest.requireActual('../useBaseQuery')

export const useBaseQuery = jest.fn(originImpl)
export const unrefQueryArgs = originalParse
