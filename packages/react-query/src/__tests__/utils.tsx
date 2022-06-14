import * as React from 'react'
import { render } from '@testing-library/react'
import { setActTimeout } from '../../tests/utils'
import { QueryClient, ContextOptions, QueryClientProvider } from '../../build/types'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
  options: ContextOptions = {}
) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client} context={options.context}>
      {ui}
    </QueryClientProvider>
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client} context={options.context}>
          {rerenderUi}
        </QueryClientProvider>
      ),
  }
}

export const Blink = ({
  duration,
  children,
}: {
  duration: number
  children: React.ReactNode
}) => {
  const [shouldShow, setShouldShow] = React.useState<boolean>(true)

  React.useEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}
