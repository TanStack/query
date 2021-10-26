import React from 'react'

export default function useMediaQuery(query: string): boolean | undefined {
  // Keep track of the preference in state, start with the current match
  const [isMatch, setIsMatch] = React.useState(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return window.matchMedia && window.matchMedia(query).matches
    }
  })

  // Watch for changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!window.matchMedia) {
        return
      }

      // Create a matcher
      const matcher = window.matchMedia(query)

      // Create our handler
      const onChange = ({ matches }: { matches: boolean }) =>
        setIsMatch(matches)

      // Listen for changes
      matcher.addListener(onChange)

      return () => {
        // Stop listening for changes
        matcher.removeListener(onChange)
      }
    }
  }, [isMatch, query, setIsMatch])

  return isMatch
}
