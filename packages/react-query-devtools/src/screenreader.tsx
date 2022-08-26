import * as React from 'react'

export default function ScreenReader({ text }: { text: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        width: '0.1px',
        height: '0.1px',
        overflow: 'hidden',
      }}
    >
      {text}
    </span>
  )
}
