import QueryClientProvider from '../QueryClientProvider'
import {
  UseIsFetchingTest1,
  UseIsFetchingTest2,
  UseIsFetchingTest3,
} from './useIsFetching'

describe('useIsFetching', () => {
  it('should update as queries start and stop fetching', () => {
    cy.mount(
      <QueryClientProvider>
        <UseIsFetchingTest1 />
      </QueryClientProvider>,
    )

    cy.get('div').should('contain.text', 'isFetching: 0')
    cy.get('button').click()
    cy.get('div').should('contain.text', 'isFetching: 1')
    cy.get('div').should('contain.text', 'isFetching: 0')
  })

  it('should be able to filter', () => {
    cy.mount(
      <QueryClientProvider>
        <UseIsFetchingTest2 />
      </QueryClientProvider>,
    )

    cy.get('div').should('contain.text', 'isFetching: 0')
    cy.get('button').click()
    cy.get('div').should('contain.text', 'isFetching: 1')
  })

  it('should show the correct fetching state when mounted after a query', () => {
    cy.mount(
      <QueryClientProvider>
        <UseIsFetchingTest3 />
      </QueryClientProvider>,
    )
    cy.get('div').should('contain.text', 'isFetching: 1')
    cy.get('div').should('contain.text', 'isFetching: 0')
  })
})
