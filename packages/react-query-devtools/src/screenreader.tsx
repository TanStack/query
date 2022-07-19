import * as React from 'react'

export default function ScreenReader(children: React.ReactNode) {
  return (
    <span
      style={{
        position: "absolute",
        width: "0.1px",
        height: "0.1px", 
        overflow: "hidden",
      }}
      className="screenreader"
    >
      {children}
    </span>
  )
}