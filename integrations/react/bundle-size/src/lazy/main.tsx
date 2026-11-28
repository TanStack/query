import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '#adapter'
import { ReadingList as BookList } from '../query.tsx'

const LazyBookmarks = React.lazy(() =>
  import('../paginated.tsx').then(({ ReadingList }) => ({
    default: ReadingList,
  })),
)
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
})

function Bookmarks() {
  return (
    <React.Suspense fallback={<p>Loading bookmarks…</p>}>
      <LazyBookmarks />
    </React.Suspense>
  )
}

function Library() {
  const [route, setRoute] = React.useState<'book-list' | 'bookmarks'>(
    'book-list',
  )
  return (
    <>
      <nav aria-label="Library">
        <button id="book-list" onClick={() => setRoute('book-list')}>
          Book list
        </button>
        <button id="bookmarks" onClick={() => setRoute('bookmarks')}>
          Bookmarks
        </button>
      </nav>
      <h1>{route === 'book-list' ? 'Book list' : 'Bookmarks'}</h1>
      {route === 'book-list' ? <BookList /> : <Bookmarks />}
    </>
  )
}

function ScrollingLibrary() {
  const shelf = React.useRef<HTMLElement>(null)
  const [showBookmarks, setShowBookmarks] = React.useState(false)
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShowBookmarks(true)
        observer.disconnect()
      }
    })
    observer.observe(shelf.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section id="book-list-section" style={{ minHeight: '110vh' }}>
        <h1>Book list</h1>
        <BookList />
      </section>
      <section
        id="bookmarks-shelf"
        aria-labelledby="bookmarks-heading"
        ref={shelf}
      >
        <h2 id="bookmarks-heading">Bookmarks</h2>
        {showBookmarks && <Bookmarks />}
      </section>
    </>
  )
}

const scrollLayout =
  new URLSearchParams(location.search).get('layout') === 'scroll'

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    {scrollLayout ? <ScrollingLibrary /> : <Library />}
  </QueryClientProvider>,
)
