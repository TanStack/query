// ✅ passes: the query depends on a filter held in useState, which only exists at render time, so it isn't reported
import { TodoList } from './todo-list'

export default function TodosPage() {
  return <TodoList />
}
