// ❌ fails: the messages query sits two client components deep (InboxShell -> MessageList) and is never prefetched
import { InboxShell } from './inbox-shell'

export default function InboxPage() {
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'messagesOptions' used by 'useSuspenseQuery' in './message-list.tsx' isn't prefetched in this page, so it only starts fetching after the component renders. Start it in this page by passing the same query options to 'queryClient.query()'.
  return <InboxShell />
}
