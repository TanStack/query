const { useBaseQuery: originImpl, parseQueryArgs: originalParse } =
  jest.requireActual('../useBaseQuery')

export const useBaseQuery = jest.fn(originImpl)
export const parseQueryArgs = originalParse
