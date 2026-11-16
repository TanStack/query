export const Link = (props: {
  href: string
  children: any
  class?: string
}) => {
  // Links doing client-side navigation
  return (
    <a
      href={props.href}
      onClick={(e) => {
        e.preventDefault()
        history.pushState({}, '', props.href)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
      class={props.class}
    >
      {props.children}
    </a>
  )
}
