import * as React from 'react'
import { ParentSize } from '@visx/responsive'
import Head from 'next/head'
import Link from 'next/link'

//
import { siteConfig } from '../siteConfig'

import { Banner } from '../components/Banner'
import { Sticky } from '../components/Sticky'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { ClientsMarquee } from '../components/clients/ClientsMarquee'
import { Seo } from '../components/Seo'

const Home = ({ sponsors }) => {
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
                      <Link href="/overview">
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
                  <div className="mt-5">
                    <p>
                      Still using v2? No problem!{' '}
                      <a
                        href="https://react-query-v2.tanstack.com/docs/overview"
                        className="text-blue-600 font-semibold transition-colors duration-150 ease-out"
                      >
                        Find the v2 docs here.
                      </a>
                    </p>
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
                      Writing your data fetching logic by hand is over. Tell
                      React Query where to get your data and how fresh you need
                      it to be and the rest is automatic. React Query handles
                      caching, background updates and stale data out of the box
                      with zero-configuration.
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
                      state to manage, reducers, normalization systems or heavy
                      configurations to understand. Simply pass a function that
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
                      React Query is configurable down to each observer instance
                      of a query with knobs and options to fit every use-case.
                      It comes wired up with dedicated devtools,
                      infinite-loading APIs, and first class mutation tools that
                      make updating your data a breeze. Don't worry though,
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
        <div className="bg-gray-900 text-white">
          <div className="py-32">
            <div className="mx-auto container text-center">
              <div className="text-xl">ANNOUNCING</div>
              <div className="text-3xl md:text-5xl font-bold">
                React Query Essentials
              </div>
              <div className="text-xl italic">
                The <strong>official</strong> React Query course by{' '}
                <strong>Tanner Linsley</strong>
              </div>
              <a
                href="https://learn.tanstack.com"
                className="inline-block mt-8 rounded shadow-lg bg-coral text-white font-bold text-xl px-4 py-3"
              >
                ENROLL NOW
              </a>
              <div className="grid pt-8 text-white max-w-screen-lg mx-auto text-lg">
                <span className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  50+ Lessons
                </span>
                <span className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  3+ Hours of Live-Code Training
                </span>
                <span className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Lesson Source Code
                </span>
                <span className="mb-2">
                  <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                    <Check />
                  </span>
                  Full API coverage
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative text-lg border-t border-gray-200 bg-gray-100 overflow-hidden">
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
                    className="text-gray-200"
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
          <div className="relative">
            <h3 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 lg:leading-none mt-8">
              Sponsors
            </h3>
            <div className="py-4 flex flex-wrap max-w-screen-md mx-auto">
              <ParentSize>
                {({ width }) => {
                  return (
                    <iframe
                      title="sponsors"
                      src="https://tanstack.com/sponsors-embed"
                      style={{
                        width: width,
                        height: width,
                        overflow: 'hidden',
                      }}
                    />
                  )
                }}
              </ParentSize>
            </div>
            <div className="text-center mb-8">
              <a
                href="https://github.com/sponsors/tannerlinsley"
                className="inline-block bg-green-500 px-4 py-2 text-xl mx-auto leading-tight font-extrabold tracking-tight text-white rounded-full"
              >
                Become a Sponsor!
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
              literally write a tiny fraction of the code you normally would.
              You will be surprised at how little code you're writing or how
              much code you're deleting when you use React Query.
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
                With React as the only dependency, React Query is extremely
                lean, but also strategically packed to the brim with features
                you're bound to need in almost any project. From weekend hobbies
                all the way up to enterprise e-commerce systems (lookin' at you
                Walmart!), React Query is jam packed with battle-hardened tools
                to help you succeed.
              </p>
            </div>
            <div>
              <div className="grid grid-flow-row grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-4 text-white max-w-screen-lg mx-auto text-lg">
                {[
                  'Backend agnostic',
                  'Dedicated Devtools',
                  'Auto Caching',
                  'Auto Refetching',
                  'Window Focus Refetching',
                  'Polling/Realtime Queries',
                  'Parallel Queries',
                  'Dependent Queries',
                  'Mutations API',
                  'Automatic Garbage Collection',
                  'Paginated/Cursor Queries',
                  'Load-More/Infinite Scroll Queries',
                  'Scroll Recovery',
                  'Request Cancellation',
                  'Suspense Ready!',
                  'Render-as-you-fetch',
                  'Prefetching',
                  'Variable-length Parallel Queries',
                  'Offline Support',
                  'SSR Support',
                  'Data Selectors',
                ].map(feature => (
                  <span className="mb-2" key={feature}>
                    <span className="bg-coral text-gray-800 w-4 h-4 mr-2 rounded-full inline-flex items-center justify-center">
                      <Check />
                    </span>
                    {feature}
                  </span>
                ))}
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
                <Link href="/overview">
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
