// ✅ passes: `_drafts` is a private folder, so Next.js doesn't route it and this work-in-progress page
// isn't checked, even though nothing here prefetches messagesOptions
import { MessageList } from '../inbox/message-list'

export default function DraftInboxPage() {
  return <MessageList />
}
