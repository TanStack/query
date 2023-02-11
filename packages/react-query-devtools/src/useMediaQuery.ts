import * as React from 'react'

export default function useMediaQuery(query: string): boolean | undefined {
  // Keep track of the preference in state, start with the current match
  const [isMatch, setIsMatch] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return
  })

  // Watch for changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
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
    return
  }, [isMatch, query, setIsMatch])

  return isMatch
}
