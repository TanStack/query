import React from 'react'
import '@docsearch/react/dist/style.css'
import '../styles/index.css'
import Head from 'next/head'
import { SearchProvider } from 'components/useSearch'

function loadScript(src, attrs = {}) {
  if (typeof document !== 'undefined') {
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    Object.keys(attrs).forEach(attr => script.setAttribute(attr, attrs[attr]))
    script.src = src
    document.body.appendChild(script)
  }
}

function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    loadScript('https://buttons.github.io/buttons.js')
  }, [])

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        src="https://static.scarf.sh/a.png?x-pxid=c03d3ddd-b47e-4e26-a9b2-9df68b2ac970"
        className="h-0"
      />
      <SearchProvider>
        <Component {...pageProps} />
      </SearchProvider>
    </>
  )
}

export default MyApp
