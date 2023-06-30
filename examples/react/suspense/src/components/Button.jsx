import React from 'react'

import Spinner from './Spinner'

export default function Button({ children, onClick }) {
  const [isPending, startTransition] = React.useTransition()

  const handleClick = (e) => {
    startTransition(() => {
      onClick(e)
    })
  }

  return (
    <>
      <button onClick={handleClick} disabled={isPending}>
        {children} {isPending ? <Spinner /> : null}
      </button>
    </>
  )
}
