import * as React from 'react'
import Link from 'next/link'
export const Footer = props => {
  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  Resources
                </h4>
                <ul className="mt-4">
                  <li>
                    <Link href="/docs/overview">
                      <a className="text-base leading-6 text-gray-500 hover:text-gray-900">
                        Docs
                      </a>
                    </Link>
                  </li>
                  <li className="mt-4">
                    <Link href="/docs/examples/simple">
                      <a className="text-base leading-6 text-gray-500 hover:text-gray-900">
                        Examples
                      </a>
                    </Link>
                  </li>
                  <li className="mt-4">
                    <Link href="/docs/api">
                      <a className="text-base leading-6 text-gray-500 hover:text-gray-900">
                        API Reference
                      </a>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  Community
                </h4>
                <ul className="mt-4">
                  <li className="mt-4">
                    <a
                      href="https://github.com/tannerlinsley/react-query/discussions"
                      className="text-base leading-6 text-gray-500 hover:text-gray-900"
                    >
                      Forum & Support
                    </a>
                  </li>
                  <li className="mt-4">
                    <a
                      href="https://discord.gg/WrRKjPJ"
                      className="text-base leading-6 text-gray-500 hover:text-gray-900"
                    >
                      #TanStack Discord
                    </a>
                  </li>
                  <li className="mt-4">
                    <a
                      href="http://stackoverflow.com/questions/tagged/react-query"
                      className="text-base leading-6 text-gray-500 hover:text-gray-900"
                    >
                      Stack Overflow
                    </a>
                  </li>
                  <li className="mt-4">
                    <a
                      href="https://github.com/tannerlinsley/react-query/releases"
                      className="text-base leading-6 text-gray-500 hover:text-gray-900"
                    >
                      Releases
                    </a>
                  </li>
                  <li className="mt-4">
                    <a
                      className="github-button"
                      href="https://github.com/tannerlinsley/react-query"
                      data-color-scheme="no-preference: light; light: light; dark: dark;"
                      data-icon="octicon-star"
                      data-size="large"
                      data-show-count="true"
                      aria-label="Star tannerlinsley/react-query on GitHub"
                    >
                      Star
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 xl:mt-0">
            <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
              Subscribe to our newsletter
            </h4>
            <p className="mt-4 text-gray-500 text-base leading-6 mb-4">
              The latest TanStack news, articles, and resources, sent to your
              inbox.
            </p>
            <form
              action="https://app.convertkit.com/forms/1513638/subscriptions"
              className=""
              method="post"
              data-sv-form="1513638"
              data-uid="4fc050bc50"
              data-format="inline"
              data-version="5"
              data-options='{"settings":{"after_subscribe":{"action":"message","success_message":"Success! Please, check your email to confirm your subscription.","redirect_url":""},"modal":{"trigger":null,"scroll_percentage":null,"timer":null,"devices":null,"show_once_every":null},"recaptcha":{"enabled":false},"slide_in":{"display_in":null,"trigger":null,"scroll_percentage":null,"timer":null,"devices":null,"show_once_every":null}}}'
            >
              <ul
                className="formkit-alert formkit-alert-error"
                data-element="errors"
                data-group="alert"
              />

              <div
                data-element="fields"
                className="seva-fields grid grid-cols-3 gap-2 max-w-lg"
              >
                <input
                  className="formkit-input border rounded p-2 mb-4 w-full col-span-2"
                  name="email_address"
                  placeholder="Your email address"
                  type="text"
                  required=""
                />
                <button
                  data-element="submit"
                  className="formkit-submit mb-4 border rounded bg-coral border-none text-white"
                >
                  <span>Subscribe</span>
                </button>
              </div>
              <div
                data-element="guarantee"
                className="formkit-guarantee text-gray-400 text-xs mt-4"
              >
                <p>I won't send you spam.</p>
                <p>
                  Unsubscribe at <em>any</em> time.
                </p>
              </div>
            </form>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex md:order-2">
            <a
              href="https://twitter.com/tannerlinsley"
              className="ml-6 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="https://github.com/tannerlinsley"
              className="ml-6 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
          <p className="mt-8 text-base leading-6 text-gray-400 md:mt-0 md:order-1">
            &copy; 2020 Tanner Linsley. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
Footer.displayName = 'Footer'
