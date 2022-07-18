import { useQuery } from '../useQuery'

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false

export type Expect<T extends true> = T

const doNotExecute = (_func: () => void) => true

describe('initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when initialData is provided as an object', () => {
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should always be defined when initialData is provided as a function which ALWAYS returns the data', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => ({
            wow: true,
          }),
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
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

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when initialData is provided as a function which can return undefined', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          initialData: () => undefined as { wow: boolean } | undefined,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
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

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
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

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when initialData is NOT provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], () => {
          return {
            wow: true,
          }
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })
})
