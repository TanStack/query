import { TodoList } from '../components/todo-list'
import { FeedSection } from '../components/feed-section'

// ✅ passes: <TodoList /> keys its query on client state, and <FeedSection /> prefetches and
// dehydrates the feed itself (see the components for details).
export default async function HomePage() {
  return (
    <>
      <FeedSection />
      <TodoList />
    </>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
