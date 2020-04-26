import React from 'react'

export default function useIntersectionObserver({
  root,
  target,
  onIntersect,
  threshold = 1.0,
  rootMargin = '0px',
}) {
  React.useEffect(() => {
    const observer = new IntersectionObserver(onIntersect, {
      root: root && root.current,
      rootMargin,
      threshold,
    })

    const el = target && target.current

    if (!el) {
      return
    }

    observer.observe(el)

    return () => {
      observer.unobserve(el)
    }
  }, [target.current])
}
