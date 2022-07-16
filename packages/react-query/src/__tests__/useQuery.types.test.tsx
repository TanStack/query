import { useQuery } from '../useQuery'

const assert = <T,>(type: T) => void 0

describe('useQuery', () => {
  it('TData should always be defined when initialData is provided', () => {
    const { data } = useQuery({
      //    ^?
      queryFn: () => {
        return {
          wow: true,
        }
      },
      initialData: {
        wow: true,
      },
    })

    assert<{ wow: boolean }>(data)
  })

  it('TData should have undefined in the union when initialData is NOT provided', () => {
    const { data } = useQuery({
      //    ^?
      queryFn: () => {
        return {
          wow: true,
        }
      },
    })

    assert<{ wow: boolean } | undefined>(data)
  })
})
