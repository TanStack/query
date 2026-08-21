import { Link as RouterLink } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h2 className="text-4xl">TanStack Query Demo</h2>
      <p>Using the Star Wars API</p>
      <p>
        (Built by{' '}
        <a
          className="text-blue-500 hover:underline"
          href="https://twitter.com/Brent_m_Clark"
        >
          @Brent_m_Clark
        </a>
        )
      </p>
      <h5 className="text-2xl pt-4">Why TanStack Query?</h5>
      <p>
        In this demo you will be able to see how TanStack Query is a significant
        improvement over <strong>redux</strong>, <strong>mobx</strong>, and any
        other general-purpose state container.
      </p>
      <p>
        No reducers, thunks, or sagas. No ES6 models to maintain in order to tag
        them as observable.
      </p>
      <p>
        Simply associate a key with your fetch call and let{' '}
        <strong>TanStack Query</strong> handle the rest.
      </p>
      <h5 className="text-2xl pt-4">Ready to get started?</h5>
      <p>
        Check out the{' '}
        <RouterLink className="text-blue-500 hover:underline" to="/films">
          Films
        </RouterLink>{' '}
        and{' '}
        <RouterLink className="text-blue-500 hover:underline" to="/characters">
          Characters
        </RouterLink>
        !
      </p>
    </div>
  )
}
