import { defineCE, fixture, waitUntil } from '@open-wc/testing-helpers'
import { when } from 'jest-when'
import { getNodeFor, setUpQueryClient } from '../testHelpers'
import {
  ANOTHER_TODO,
  ANOTHER_TODO_ID,
  A_TODO,
  A_TODO_ID,
  ReadOneTodoComponent,
  getTodoById,
} from './TodoComponent'

const tag = defineCE(ReadOneTodoComponent)

describe('QueryController', () => {
  beforeEach(setUpQueryClient)

  describe('pending', () => {
    beforeEach(() => {
      getTodoById.mockImplementationOnce(() => new Promise(() => {}))
    })
    it('should set into pending state', async () => {
      const el = await fixture<ReadOneTodoComponent>(`<${tag}></${tag}>`)
      await el.updateComplete

      expect(getNodeFor('div', el).textContent).toBe('Loading...')
    })
  })

  describe('error', () => {
    beforeEach(() => {
      getTodoById.mockRejectedValueOnce(new Error('error'))
    })
    it('should set into error state', async () => {
      const el = await fixture<ReadOneTodoComponent>(`<${tag}></${tag}>`)
      await el.updateComplete

      expect(getNodeFor('div', el).textContent).toBe('Error')
    })
  })

  describe('success', () => {
    beforeEach(() => {
      when(getTodoById).calledWith(A_TODO_ID).mockResolvedValue(A_TODO)
    })
    it('should set into success state', async () => {
      const el = await fixture<ReadOneTodoComponent>(`<${tag}></${tag}>`)
      await el.updateComplete

      const { userId, id, title, completed } = A_TODO
      expect(getNodeFor('div', el).textContent).toBe(
        `userId: ${userId}, id: ${id}, title: ${title}, completed: ${completed}`,
      )
    })
  })

  describe('success with different todoId', () => {
    beforeEach(() => {
      when(getTodoById).calledWith(A_TODO_ID).mockResolvedValue(A_TODO)
      when(getTodoById)
        .calledWith(ANOTHER_TODO_ID)
        .mockResolvedValue(ANOTHER_TODO)
    })
    it('should set new todo when property is updated', async () => {
      const el = await fixture<ReadOneTodoComponent>(`<${tag}></${tag}>`)
      await el.updateComplete

      const { userId, id, title, completed } = A_TODO
      expect(getNodeFor('div', el).textContent).toBe(
        `userId: ${userId}, id: ${id}, title: ${title}, completed: ${completed}`,
      )

      // update property
      el.todoId = ANOTHER_TODO_ID
      await el.updateComplete

      const {
        userId: userId2,
        id: id2,
        title: title2,
        completed: completed2,
      } = ANOTHER_TODO
      await waitUntil(
        () =>
          getNodeFor('div', el).textContent ===
          `userId: ${userId2}, id: ${id2}, title: ${title2}, completed: ${completed2}`,
      )
    })
  })
})
