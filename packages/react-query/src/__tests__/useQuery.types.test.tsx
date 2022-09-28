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

describe('suspense', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when suspense is true', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is false', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: false,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is NOT provided', () => {
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

    it('TData should have undefined in the union when suspense is true and enabled is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: false,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })

  describe('Query key overload', () => {
    it('TData should always be defined when suspense is true', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is false', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: false,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is NOT defined', () => {
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

    it('TData should have undefined in the union when suspense is true and enabled is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: false,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })

  describe('Query key and func', () => {
    it('TData should always be defined when suspense is true', () => {
      doNotExecute(() => {
        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            suspense: true,
          },
        )

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is false', () => {
      doNotExecute(() => {
        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            suspense: false,
          },
        )

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is NOT defined', () => {
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

    it('TData should have undefined in the union when suspense is true and enabled is provided', () => {
      doNotExecute(() => {
        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            suspense: true,
            enabled: false,
          },
        )

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })
})

describe('suspense with initialData', () => {
  describe('Config object overload', () => {
    it('TData should always be defined when suspense is enabled conditionally and initialData is provided as an object', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
          initialData: {
            wow: true,
          },
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should always be defined when suspense is enabled conditionally and initialData is provided as a function which ALWAYS returns the data', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
          initialData: () => ({
            wow: true,
          }),
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is enabled conditionally and initialData is NOT provided', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is enabled conditionally and initialData is provided as a function which can return undefined', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery({
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
          initialData: () => undefined as { wow: boolean } | undefined,
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })

  describe('Query key overload', () => {
    it('TData should always be defined when suspense is enabled conditionally and initialData is provided', () => {
      const getEnabled = () => true

      doNotExecute(() => {
        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
          initialData: {
            wow: true,
          },
        })

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is enabled conditionally and initialData is NOT provided', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery(['key'], {
          queryFn: () => {
            return {
              wow: true,
            }
          },
          suspense: true,
          enabled: getEnabled(),
        })

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })

  describe('Query key and func', () => {
    it('TData should always be defined when suspense is enabled conditionally and initialData is provided', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            suspense: true,
            enabled: getEnabled(),
            initialData: {
              wow: true,
            },
          },
        )

        const result: Expect<Equal<{ wow: boolean }, typeof data>> = true
        return result
      })
    })

    it('TData should have undefined in the union when suspense is enabled conditionally and initialData is NOT provided', () => {
      doNotExecute(() => {
        const getEnabled = () => true

        const { data } = useQuery(
          ['key'],
          () => {
            return {
              wow: true,
            }
          },
          {
            suspense: true,
            enabled: getEnabled(),
          },
        )

        const result: Expect<Equal<{ wow: boolean } | undefined, typeof data>> =
          true
        return result
      })
    })
  })
})
