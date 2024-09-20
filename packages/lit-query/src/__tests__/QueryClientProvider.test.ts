import { describe, expect, test } from 'vitest'
import { defineCE, fixture, html } from '@open-wc/testing-helpers'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, QueryController } from '..'
import { ReadOneTodoComponent } from './TodoComponent'

const todoTag = defineCE(ReadOneTodoComponent)

describe('QueryClientProvider', () => {
  test('has a shadowDom and a slot', async () => {
    const el = await fixture<QueryClientProvider>(
      html`<query-client-provider>Test</query-client-provider>`,
    )

    await el.updateComplete

    expect(el).to.exist
    expect(el.shadowRoot?.querySelector('slot')).to.exist
    expect(
      el.shadowRoot?.querySelector('slot')?.assignedNodes()[0]?.nodeValue,
    ).toBe('Test')
  })

  test('connects a context consumer to a context provider', async () => {
    const provider = new QueryClientProvider()
    const el = await fixture<ReadOneTodoComponent>(
      `<${todoTag}></${todoTag}>`,
      { parentNode: provider },
    )

    await el.updateComplete

    expect(el).to.have.property('todoQuery')
    expect(el.todoQuery).to.be.instanceOf(QueryController)

    const consumedQueryClient = await el.todoQuery.whenQueryClient.promise

    expect(consumedQueryClient).to.be.instanceOf(QueryClient)
    expect(consumedQueryClient).to.equal(provider.queryClient)
  })
})
