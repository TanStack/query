import * as React from 'react'
import Link from 'next/link'
import logoSrc from '../images/logo.svg'
import { siteConfig } from 'siteConfig'
import { Search } from './Search'

export const Nav = () => (
  <div className="bg-white border-b border-gray-200">
    <div className="container mx-auto">
      <div className="flex flex-wrap items-center">
        <div className="w-60 flex items-center h-16 pt-4 md:pt-0">
          <Link href="/" as="/">
            <a>
              <span className="sr-only">Home</span>
              <img src={logoSrc} alt="React Query" />
            </a>
          </Link>
        </div>

        <div className="flex-grow hidden lg:block ml-8">
          <Search />
        </div>

        <div className="flex flex-grow items-center justify-between w-3/4 md:w-auto md:justify-end space-x-4 md:space-x-8 h-16">
          <div className="flex space-x-4 md:space-x-8 text-sm md:text-base">
            <div>
              <Link href="/docs/overview">
                <a className="leading-6 font-medium">Docs</a>
              </Link>
            </div>
            <div>
              <Link href="/docs/examples/simple">
                <a className="leading-6 font-medium">Examples</a>
              </Link>
            </div>
            <div>
              <Link href="/docs/api">
                <a className="leading-6 font-medium">API</a>
              </Link>
            </div>
            <div>
              <a href="https://tanstack.com" className="leading-6 font-medium">
                TanStack
              </a>
            </div>
          </div>
          <div>
            <a
              href={siteConfig.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
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
        </div>
      </div>
    </div>
  </div>
)
