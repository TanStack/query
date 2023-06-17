import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export const Header = () => {
  const { pathname } = useRouter()

  return (
    <header>
      <Link href="/" className={pathname === '/' ? 'is-active' : ''}>
        Home
      </Link>
      <Link
        href="/client-only"
        className={pathname === '/client-only' ? 'is-active' : ''}
      >
        Client-Only
      </Link>
      <style jsx>{`
        header {
          margin-bottom: 25px;
        }
        a {
          font-size: 14px;
          margin-right: 15px;
          text-decoration: none;
        }
        .is-active {
          text-decoration: underline;
        }
      `}</style>
    </header>
  )
}
