import * as React from 'react'
import { Banner } from 'components/Banner'
import { Sticky } from 'components/Sticky'
import { Nav } from 'components/Nav'
import { siteConfig } from 'siteConfig'
import Link from 'next/link'
import { Footer } from 'components/Footer'
import { ClientsMarquee } from 'components/clients/ClientsMarquee'
import { Seo } from 'components/Seo'
import Head from 'next/head'

const Home = props => {
  return (
    <>
      <Seo
        title="React Query"
        description="Hooks for fetching, caching and updating asynchronous data in React"
      />
      <Head>
        <title>
          React Query - Hooks for fetching, caching and updating asynchronous
          data in React
        </title>
      </Head>
      <div className="bg-gray-50 h-full min-h-full">
        <Banner />
        <Sticky>
          <Nav />
        </Sticky>
        <div className="relative bg-white overflow-hidden">
          <div className="py-24 mx-auto container px-4 sm:mt-12  relative">
            <img
              src={require('images/emblem-light.svg')}
              className="absolute transform right-0 top-1/2 h-0 lg:h-full scale-150 translate-x-1/2 xl:translate-x-1/5 -translate-y-1/2"
              alt="React Query Emblem"
            />
            <div className="grid grid-cols-12 lg:gap-8">
              <div className="col-span-12 lg:col-span-6 ">
                <div className="text-center lg:text-left md:max-w-2xl md:mx-auto ">
                  <h1 className="text-4xl tracking-tight leading-10 font-extrabold text-gray-900 sm:leading-none sm:text-6xl lg:text-5xl xl:text-6xl">
                    Performant and powerful data
                    <br className="hidden md:inline xl:hidden" />{' '}
                    <span>synchronization for React</span>
                  </h1>
                  <p className="mt-3 text-base text-gray-700 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                    Fetch, cache and update data in your React and React Native
                    applications all without touching any "global state".
                  </p>

                  <div className="mt-5  mx-auto sm:flex sm:justify-center lg:justify-start lg:mx-0 md:mt-8">
                    <div className="rounded-md shadow">
                      <Link href="/docs/overview">
                        <a className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-coral hover:bg-coral-light focus:outline-none focus:border-coral focus:shadow-outline-coral transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10">
                          Get Started
                        </a>
                      </Link>
                    </div>
                    <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                      <a
                        href={siteConfig.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-coral bg-white hover:text-coral-light focus:outline-none focus:border-coral-light focus:shadow-outline-coral transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-lg border-t border-gray-200 bg-gray-50 ">
          <div className="py-24  ">
            <div className="mx-auto container">
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <div>
                  <div>
                    <h3 className="text-xl leading-6 xl:text-2xl font-bold text-gray-900">
                      Declarative & Automatic
                    </h3>
                    <p className="mt-2 lg:mt-4 text-base xl:text-lg lg:leading-normal leading-6 text-gray-600">
                      Writing your data fetching logic by hand is on its way
                      out. Just tell React Query where to get your data and how
                      fresh you want to keep it and the rest is automatic. React
                      Query handles caching, background updates and stale data
                      out of the box with zero-configuration.
                    </p>
                  </div>
                </div>
                <div className="mt-10 lg:mt-0">
                  <div>
                    <h3 className="text-xl leading-6 xl:text-2xl font-bold text-gray-900">
                      Simple & Familiar
                    </h3>
                    <p className="mt-2  lg:mt-4 text-base xl:text-lg lg:leading-normal leading-6 text-gray-600">
                      If you know how to work with promises or async/await, then
                      you already know how to use React Query. There's no global
                      state to manage, reducers to write, or fancy state
                      machines to understand. Just define your function that
                      resolves your data (or throws an error) and the rest is
                      history.
                    </p>
                  </div>
                </div>
                <div className="mt-10 lg:mt-0">
                  <div>
                    <h3 className="text-xl leading-6 xl:text-2xl font-bold text-gray-900">
                      Powerful & Configurable
                    </h3>
                    <p className="mt-2  lg:mt-4 text-base xl:text-lg lg:leading-normal leading-6 text-gray-600">
                      React Query is configurable down to the query with knobs
                      and options to fit every use-case. It even has dedicated
                      hooks for pagination, infinite-loading, and even mutations
                      that make updating your data a breeze. Don't worry though,
                      everything is pre-configured for success!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="py-6">
            <div className="uppercase tracking-wider text-sm font-semibold text-center text-gray-400 mb-3">
              Trusted in Production by
            </div>

            <ClientsMarquee />
          </div>
        </div>
        <div className="relative text-lg border-t border-gray-200 bg-white overflow-hidden">
          <div className="lg:block lg:absolute lg:inset-0">
            <svg
              className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2"
              width="2400"
              height="2400"
              fill="none"
              viewBox="0 0 2400 2400"
            >
              <defs>
                <pattern
                  id="9ebea6f4-a1f5-4d96-8c4e-4c2abf658047"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height="4"
                    className="text-gray-100"
                    fill="currentColor"
                  />
                </pattern>
              </defs>
              <rect
                x="0"
                width="2400"
                height="2400"
                fill="url(#9ebea6f4-a1f5-4d96-8c4e-4c2abf658047)"
              />
            </svg>
          </div>
          <div className="py-12 relative">
            <div className="uppercase tracking-wider text-4xl font-semibold text-center text-gray-500 m-6">
              Diamond Sponsors
            </div>

            <a
              href="https://github.com/sponsors/tannerlinsley"
              target="_blank"
              className="opacity-50 font-bold w-56 h-56 m-auto bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500 border-4 border-transparent hover:border-green-500 hover:text-green-500 transition duration-200 ease-out hover:opacity-100"
            >
              Become a Sponsor
            </a>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="mt-10">
                <div className="uppercase tracking-wider text-3xl font-semibold text-center text-gray-500 mt-10 m-6">
                  Gold Sponsors
                </div>
                <a
                  href="https://github.com/sponsors/tannerlinsley"
                  target="_blank"
                  className="opacity-50 font-bold w-48 h-48 m-auto bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500 border-4 border-transparent hover:border-green-500 hover:text-green-500 transition duration-200 ease-out hover:opacity-100"
                >
                  Become a Sponsor
                </a>
              </div>

              <div className="mt-10">
                <div className="uppercase tracking-wider text-3xl font-semibold text-center text-gray-500 mt-10 m-6">
                  Silver Sponsors
                </div>
                <a
                  href="https://www.reactbricks.com/"
                  target="_blank"
                  className="block w-56 m-auto"
                >
                  <img src="https://www.reactbricks.com/reactbricks_vertical.svg" />
                </a>
              </div>

              <div className="mt-10">
                <div className="uppercase tracking-wider text-3xl font-semibold text-center text-gray-500 mt-10 m-6">
                  Bronze Sponsors
                </div>
                <a
                  href="https://nozzle.io/"
                  target="_blank"
                  className="block w-48 m-auto"
                >
                  <img
                    src="https://nozzle.io/img/logo-blue.png"
                    alt="Nozzle - Google Keyword Rank Tracker"
                  ></img>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="mt-10">
                <div className="uppercase tracking-wider text-2xl font-semibold text-center text-gray-500 mt-10 m-3">
                  Supporters
                </div>
                <ul className="list-none text-center">
                  <li className="font-bold text-blue-800">
                    <a href="https://kentcdodds.com/">
                      Kent C. Dodds (kentcdodds.com)
                    </a>
                  </li>
                  <li className="font-bold text-blue-800">
                    <a href="https://github.com/bgazzera">@bgazzera</a>
                  </li>
                  <li className="font-bold text-blue-800">
                    <a href="https://github.com/gragland">Gabe Ragland</a>
                  </li>
                </ul>
              </div>

              <div className="mt-10">
                <div className="uppercase tracking-wider text-2xl font-semibold text-center text-gray-500 mt-10 m-3">
                  Fans
                </div>
                <ul className="list-none text-center">
                  <li>Steven Miyakawa (@SamSamskies)</li>
                </ul>
              </div>
            </div>
            <div className="mt-10 text-center">
              <a
                href="https://github.com/sponsors/tannerlinsley"
                target="_blank"
                className="text-lg font-bold inline-flex items-center justify-center px-6 py-3 border border-transparent text-base leading-6 font-medium rounded-full text-white bg-green-500 hover:bg-green-500-light focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              >
                Become a Sponsor
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 relative py-24 border-t border-gray-200 ">
          <div className="px-4 sm:px-6 lg:px-8  mx-auto container max-w-3xl sm:text-center">
            <h3 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 lg:leading-none mt-2">
              Less Code. Fewer Edge Cases.
            </h3>
            <p className="my-4 text-xl leading-7  text-gray-600">
              Instead of writing reducers, caching logic, timers, retry logic,
              complex async/await scripting (I could keep going...), you
              literally write a fraction of the code you normally would. You
              will be surprised at how little code you're writing or how much
              code you're deleting when you use React Query
            </p>
          </div>
          <div
            style={{
              height: 224,
            }}
          />
        </div>

        <section className="bg-gray-900 body-font">
          <div className="container max-w-7xl px-4  mx-auto -mt-72 relative">
            <iframe
              src="https://codesandbox.io/embed/github/tannerlinsley/react-query/tree/master/examples/basic?autoresize=1&fontsize=16&theme=dark"
              title="tannerlinsley/react-query: basic"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              className="shadow-2xl"
              style={{
                width: '100%',
                height: '80vh',
                border: '0',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'static',
                zIndex: 0,
              }}
            ></iframe>
          </div>
          <div className="py-24 px-4 sm:px-6 lg:px-8  mx-auto container">
            <div className=" sm:text-center pb-16">
              <h3 className="text-3xl mx-auto leading-tight font-extrabold tracking-tight text-white sm:text-4xl  lg:leading-none mt-2">
                One Dep, All the Features.
              </h3>
              <p className="mt-4 text-xl max-w-3xl mx-auto leading-7 text-gray-300">
                Sure, React is the only dependency, but React Query comes fully
                featured with all the gizmos and gadgets you want or need. From
                weekend hobby projects all the way up to enterprise e-commerce
                systems (lookin' at you Walmart!), React Query is jam packed
                with features.
              </p>
            </div>
            <div>
              <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4 text-white max-w-screen-lg mx-auto text-lg">
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Backend agnostic
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Auto Caching
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Auto Refetching
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Window Focus Refetching
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Polling/Realtime Queries
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Parallel Queries
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Dependent Queries
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Mutations API
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Automatic Garbage Collection
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Paginated/Cursor Queries
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Load-More/Infinite Scroll Queries
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Scroll Recovery
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Request Cancellation
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Suspense Ready!
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Render-as-you-fetch
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Prefetching
                </a>
                <a className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Dedicated Devtools
                </a>
              </div>
            </div>
          </div>
        </section>
        <div className="bg-gray-200 border-b border-gray-300">
          <div className="container mx-auto py-12 text-center">
            <h3 className="text-2xl md:text-5xl mx-auto leading-tight font-extrabold tracking-tight text-gray-800  lg:leading-none mt-2">
              Feeling Chatty?
            </h3>
            <a
              href="https://discord.gg/WrRKjPJ"
              target="_blank"
              className="inline-block bg-gray-800 p-5 text-2xl mx-auto leading-tight font-extrabold tracking-tight text-white mt-12 rounded-full"
            >
              Join the #TanStack Discord!
            </a>
          </div>
        </div>
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto py-24 px-4 flex flex-wrap md:flex-no-wrap items-center justify-between md:space-x-8">
            <h2 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10">
              Wow, you've come a long way!
            </h2>
            <div className="mt-8 flex lg:flex-shrink-0 md:mt-0">
              <div className="inline-flex rounded-md shadow">
                <Link href="/docs/overview">
                  <a className="inline-flex items-center justify-center text-center px-5 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-coral hover:bg-coral-light focus:outline-none focus:shadow-outline transition duration-150 ease-in-out">
                    Okay, let's get started!
                  </a>
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <a
                  href={siteConfig.repoUrl}
                  className="inline-flex items-center justify-center text-center px-5 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-coral bg-white hover:text-coral-light focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                >
                  Take me to the GitHub repo.
                </a>
              </div>
            </div>
          </div>
        </div>
        <Footer />
        <style jsx global>{`
          .gradient {
            -webkit-mask-image: linear-gradient(
              180deg,
              transparent 0,
              #000 30px,
              #000 calc(100% - 200px),
              transparent calc(100% - 100px)
            );
          }
        `}</style>
      </div>
    </>
  )
}

export default Home
Home.displayName = 'Home'
const Check = React.memo(() => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="3"
    className="w-3 h-3"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5"></path>
  </svg>
))
