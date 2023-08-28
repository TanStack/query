import { $, component$ } from '@builder.io/qwik'
import QueryClientProvider from '../QueryClientProvider'
import { useInfiniteQuery } from '../useInfiniteQuery'

describe('useInfiniteQuery', () => {
  it('should call getNextPageParam', async () => {
    const UseInfinityQueryTest1 = component$(() => {
      const queryStore = useInfiniteQuery({
        queryKey: ['projects'],
        queryFn: $(async ({ pageParam }) => {
          console.log('queryFn', pageParam)
          return Number(1)
        }),
        defaultPageParam: 0,
        getPreviousPageParam: $((firstPage: any) => {
          return firstPage.previousId ?? undefined
        }),
        getNextPageParam: $((allPages) => {
          console.log('getNextPageParam', allPages)
          return allPages + 1
        }),
        maxPages: 3,
      })
      return (
        <div>
          <p>{JSON.stringify(queryStore.result?.data)}</p>
          <button
            onClick$={() => {
              queryStore.options.getNextPageParam(queryStore.options.maxPages)
            }}
          >
            Test
          </button>
        </div>
      )
    })

    cy.mount(
      <QueryClientProvider>
        <UseInfinityQueryTest1 />
      </QueryClientProvider>,
    )

    cy.get('p').should('contain.text', '1')
    cy.get('button').click()
    cy.get('p').should('contain.text', '1')
  })
})
