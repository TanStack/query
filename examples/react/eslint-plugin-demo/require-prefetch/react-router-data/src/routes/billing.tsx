// Loaded with `lazy: () => import('./routes/billing')`, so React Router reads the route's `Component`
// (and `loader`, which this module doesn't export) from it.
import { useSuspenseQuery } from '@tanstack/react-query'
import { billingOptions } from '../queries'

export function Component() {
  const { data: billing } = useSuspenseQuery(billingOptions())

  return <p>Plan: {billing.plan}</p>
}
