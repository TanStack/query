// ✅ passes: `currentUserOptions` is prefetched and dehydrated by the layout above (_layout.tsx).
import { AccountDetails } from '../components/account-details'

export default async function AccountPage() {
  return <AccountDetails />
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
