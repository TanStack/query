const { useBaseQuery: originImpl } = jest.requireActual('../useBaseQuery')

export const useBaseQuery = jest.fn(originImpl)
