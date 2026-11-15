import { A } from '@solidjs/router'

export default function Home() {
  return (
    <div>
      <h2 class="text-4xl">TanStack Query Demo</h2>
      <p>Using the Rick And Morty API</p>
      <p>
        (Built by{' '}
        <a
          class="text-blue-500 hover:underline"
          href="https://twitter.com/axelfuh"
        >
          @axelfuh
        </a>
        )
      </p>
      <h5 class="text-2xl pt-4">Why TanStack Query?</h5>
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
      <h5 class="text-2xl pt-4">Ready to get started?</h5>
      <p>
        Check out the{' '}
        <A class="text-blue-500 hover:underline" href="/episodes">
          Episodes
        </A>{' '}
        and{' '}
        <A class="text-blue-500 hover:underline" href="/characters">
          Characters
        </A>
        !
      </p>
    </div>
  )
}
