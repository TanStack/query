// ✅ passes: files in `pages/_components` aren't pages, so they aren't checked, even though
// nothing here prefetches `postOptions`.
import { PostInfo } from '../../components/post-info'

export function PostPreview({ id }: { id: string }) {
  return <PostInfo id={id} />
}
