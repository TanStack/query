import React from 'react'
import { LayoutDocs } from '../components/LayoutDocs'

export default function NotFound() {
  return (
    <LayoutDocs meta={{}}>
      <h1>Snap! We couldn't find that page.</h1>
      <p>Please use the menu to find what you're looking for.</p>
    </LayoutDocs>
  )
}
