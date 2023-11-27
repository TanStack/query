import { $, component$ } from '@builder.io/qwik'
import QueryClientProvider from '../QueryClientProvider'
import { queryKey, sleep } from './utils'
import { useQuery } from '../useQuery'

describe('useQuery', () => {
  it('should allow to set default data value', async () => {
    const UseQueryTest1 = component$(() => {
      const queryStore = useQuery({
        queryKey: queryKey(),
        queryFn: $(async () => {
          await sleep(50)
          return 'test'
        }),
      })
      return queryStore.result.status === 'pending' ? (
        <div>default</div>
      ) : (
        <div>{JSON.stringify(queryStore.result.data)}</div>
      )
    })

    cy.mount(
      <QueryClientProvider>
        <UseQueryTest1 />
      </QueryClientProvider>,
    )

    cy.get('div').should('contain.text', 'default')
    cy.get('div').should('contain.text', 'test')
  })
})
