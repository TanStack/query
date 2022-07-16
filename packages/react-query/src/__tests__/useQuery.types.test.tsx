import { useQuery } from '../useQuery'

const assert = <T,>(_type: T) => void 0

const doNotExecute = (_func: () => void) => {}

describe('useQuery', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery({
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
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
        })

        assert<{ wow: boolean } | undefined>(data)
      })
    })
  })

  describe('Query key overload', () => {
    it('TData should always be defined when initialData is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], {
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
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
        })

        assert<{ wow: boolean } | undefined>(data)
      })
    })
  })

  describe('Query key and func', () => {
    it('TData should always be defined when initialData is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            initialData: {
              wow: true,
            },
          },
        )

        assert<{ wow: boolean }>(data)
      })
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], () => {
          return {
            wow: true,
          }
        })

        assert<{ wow: boolean } | undefined>(data)
      })
    })
  })
})
