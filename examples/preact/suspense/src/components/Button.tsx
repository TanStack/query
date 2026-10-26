import type { ComponentChildren } from 'preact'

export default function Button({
  children,
  onClick,
}: {
  children: ComponentChildren
  onClick: () => void
}) {
  return <button onClick={onClick}>{children}</button>
}
