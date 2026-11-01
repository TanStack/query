import { useId } from 'preact/hooks'
import { normalizeProps, useMachine } from '@zag-js/preact'
import * as toast from '@zag-js/toast'

import './toaster.css'

export const toaster = toast.createStore({
  placement: 'top',
  overlap: true,
})

function Toast({
  toast: options,
  parent,
  index,
}: {
  toast: toast.Options
  parent: toast.GroupService
  index: number
}) {
  const service = useMachine(toast.machine, { ...options, parent, index })
  const api = toast.connect(service, normalizeProps)

  return (
    <div {...api.getRootProps()}>
      <span {...api.getTitleProps()}>{api.title}</span>
    </div>
  )
}

export function Toaster() {
  const service = useMachine(toast.group.machine, {
    id: useId(),
    store: toaster,
  })
  const api = toast.group.connect(service, normalizeProps)

  return (
    <div {...api.getGroupProps()}>
      {api.getToasts().map((options, index) => (
        <Toast
          key={options.id}
          toast={options}
          parent={service}
          index={index}
        />
      ))}
    </div>
  )
}
