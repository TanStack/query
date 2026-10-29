'use client'

import { useState } from 'react'
import { MessageList } from './message-list'

export function InboxShell() {
  const [compact, setCompact] = useState(false)

  return (
    <div className={compact ? 'compact' : undefined}>
      <button onClick={() => setCompact((value) => !value)}>
        Toggle density
      </button>
      <MessageList />
    </div>
  )
}
