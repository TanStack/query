import { useQuery } from '../useQuery'

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
  })
})
