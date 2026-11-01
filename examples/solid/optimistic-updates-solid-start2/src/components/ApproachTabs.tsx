import { Show, createSignal } from 'solid-js'
import TodoListUI from './TodoListUI'
import TodoListCache from './TodoListCache'
import type { JSX } from 'solid-js'

type Tab = 'ui-variables' | 'cache'

export default function ApproachTabs() {
  const [activeTab, setActiveTab] = createSignal<Tab>('ui-variables')

  const tabStyle = (tab: Tab): JSX.CSSProperties => ({
    padding: '0.5rem 1rem',
    border: 'none',
    'border-bottom':
      activeTab() === tab ? '2px solid #0070f3' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    'font-weight': activeTab() === tab ? 600 : 400,
    color: activeTab() === tab ? '#0070f3' : '#555',
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          'border-bottom': '1px solid #ddd',
          'margin-bottom': '1.5rem',
        }}
      >
        <button
          style={tabStyle('ui-variables')}
          onClick={() => setActiveTab('ui-variables')}
        >
          Via UI Variables
        </button>
        <button style={tabStyle('cache')} onClick={() => setActiveTab('cache')}>
          Via Cache Manipulation
        </button>
      </div>

      <Show when={activeTab() === 'ui-variables'} fallback={<TodoListCache />}>
        <TodoListUI />
      </Show>
    </div>
  )
}
