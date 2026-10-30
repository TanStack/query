// ✅ passes: currentUserOptions is prefetched and dehydrated by ./layout.tsx, so the page needs no prefetch
import { Welcome } from './welcome'

export default function DashboardPage() {
  return <Welcome />
}
