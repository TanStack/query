import { useState } from 'preact/hooks'
import TodoListUI from './TodoListUI'
import TodoListCache from './TodoListCache'
import type { CSSProperties } from 'preact'

type Tab = 'ui-variables' | 'cache'

export default function ApproachTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('ui-variables')

  const tabStyle = (tab: Tab): CSSProperties => ({
    padding: '0.5rem 1rem',
    border: 'none',
    borderBottom:
      activeTab === tab ? '2px solid #0070f3' : '2px solid transparent',
    background: 'none',
    cursor: 'pointer',
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? '#0070f3' : '#555',
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #ddd',
          marginBottom: '1.5rem',
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

      {activeTab === 'ui-variables' ? <TodoListUI /> : <TodoListCache />}
    </div>
  )
}
