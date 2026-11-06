import * as React from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useQueries,
  useQuery,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  fetchOrder,
  fetchProduct,
  fetchProducts,
  fetchUser,
  orderTrackingNumber,
  productCodename,
  productSku,
  userEmail,
} from './data'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: Infinity },
  },
})

const params = new URLSearchParams(window.location.search)
const readCount = (name: string, fallback: number) => {
  const value = Number(params.get(name) ?? fallback)
  return Number.isInteger(value) && value >= 0 ? value : fallback
}
const PRODUCT_COUNT = readCount('products', 300)
const USER_COUNT = readCount('users', 150)
const ORDER_COUNT = readCount('orders', 150)

const productListQuery = queryOptions({
  queryKey: ['products', 'list', PRODUCT_COUNT],
  queryFn: () => fetchProducts(PRODUCT_COUNT),
})
const productQuery = (id: number) =>
  queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: () => fetchProduct(id),
  })
const userQuery = (id: number) =>
  queryOptions({ queryKey: ['users', id], queryFn: () => fetchUser(id) })
const orderQuery = (id: number) =>
  queryOptions({ queryKey: ['orders', id], queryFn: () => fetchOrder(id) })

const range = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1)

/**
 * Animates with requestAnimationFrame and reports frame gaps and long tasks,
 * so main thread blocking is visible: the bar freezes while the thread is busy.
 */
function JankMeter() {
  const barRef = React.useRef<HTMLDivElement>(null)
  const statsRef = React.useRef<HTMLSpanElement>(null)
  const logRef = React.useRef<HTMLOListElement>(null)

  React.useEffect(() => {
    let frame = 0
    let last = performance.now()
    let worst = 0
    let worstAt = 0
    const loop = (now: number) => {
      const gap = now - last
      last = now
      if (gap > worst || now - worstAt > 3000) {
        worst = gap
        worstAt = now
      }
      if (barRef.current) {
        barRef.current.style.transform = `translateX(${(now / 4) % 300}px)`
      }
      if (statsRef.current) {
        statsRef.current.textContent = `worst frame gap (last 3s): ${Math.round(worst)} ms`
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)

    let observer: PerformanceObserver | undefined
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const item = document.createElement('li')
          item.textContent = `${new Date().toLocaleTimeString()} long task: ${Math.round(entry.duration)} ms`
          logRef.current?.prepend(item)
          while ((logRef.current?.children.length ?? 0) > 8) {
            logRef.current?.lastElementChild?.remove()
          }
        }
      })
      observer.observe({ type: 'longtask' })
    }

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [])

  return (
    <div style={{ border: '1px solid #ccc', padding: 8, marginBottom: 16 }}>
      <div
        style={{
          position: 'relative',
          width: 310,
          height: 10,
          background: '#eee',
        }}
      >
        <div
          ref={barRef}
          style={{ width: 10, height: 10, background: 'crimson' }}
        />
      </div>
      <span ref={statsRef} data-testid="jank-stats" />
      <ol ref={logRef} data-testid="long-tasks" style={{ margin: 0 }} />
    </div>
  )
}

function ProductCard({
  id,
  onSelect,
}: {
  id: number
  onSelect: (id: number) => void
}) {
  const { data } = useQuery(productQuery(id))
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      style={{ textAlign: 'left', fontSize: 11 }}
    >
      {data ? (
        <>
          <strong>{data.name}</strong>
          <br />
          {data.sku}
          <br />
          {data.logistics.warehouse.location.building.floor.shelf.bin.label}
        </>
      ) : (
        'Loading...'
      )}
    </button>
  )
}

function ProductDetails({ id }: { id: number }) {
  const { data } = useQuery(productQuery(id))
  if (!data) return <p>Loading product {id}...</p>
  return (
    <div>
      <h2>{data.name}</h2>
      <p>
        {data.sku} · {Object.keys(data.attributes).length} attributes ·{' '}
        {data.variants.length} variants · {data.reviews.length} reviews
      </p>
      <p style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
        {data.description}
      </p>
    </div>
  )
}

function UsersAndOrders() {
  // Keeps the queries observed; their data is only visible in the devtools
  useQueries({
    queries: [
      ...range(USER_COUNT).map(userQuery),
      ...range(ORDER_COUNT).map(orderQuery),
    ],
  })
  return null
}

function App() {
  const [selected, setSelected] = React.useState(1)
  const { data: products } = useQuery(productListQuery)

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 16 }}>
      <h1>Devtools: filter queries by data</h1>
      <JankMeter />
      <p>
        {PRODUCT_COUNT} product detail queries, {USER_COUNT} user queries and{' '}
        {ORDER_COUNT} order queries with large payloads. Change the size with{' '}
        <code>?products=600&amp;users=300&amp;orders=300</code>.
      </p>
      <p>
        Open the devtools, click the filter scope button next to the filter
        input until it shows <b>Data</b> (or <b>All</b>), then type one of these
        values. Each value only exists in the data of a single query:
      </p>
      <ul>
        <li>
          product codename: <code>{productCodename(42)}</code> (product 42,
          nested 7 levels deep)
        </li>
        <li>
          product sku: <code>{productSku(137)}</code>
        </li>
        <li>
          user email: <code>{userEmail(7)}</code>
        </li>
        <li>
          order tracking number: <code>{orderTrackingNumber(12)}</code>
        </li>
        <li>
          no match at all (worst case, every query is fully scanned):{' '}
          <code>qqqzzz</code>
        </li>
      </ul>
      <ProductDetails id={selected} />
      <h2>Products ({products?.length ?? '...'})</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 4,
        }}
      >
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            onSelect={setSelected}
          />
        ))}
      </div>
      <UsersAndOrders />
    </div>
  )
}

const rootElement = document.getElementById('root') as HTMLElement
ReactDOM.createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen />
  </QueryClientProvider>,
)
