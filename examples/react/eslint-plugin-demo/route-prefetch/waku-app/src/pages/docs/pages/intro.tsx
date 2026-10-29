// ✅ passes: `docs/pages` is a route folder named `pages` (the /docs/pages/intro page documents
// Waku's pages), and it's still covered by the prefetch in ../_layout.tsx.
import { DocsNav } from '../../../components/docs-nav'

export default async function PagesIntroPage() {
  return (
    <article>
      <DocsNav />
      <h1>Introduction to pages</h1>
    </article>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
