import React from 'react'
import '@docsearch/react/dist/style.css'
import '../styles/index.css'
import Head from 'next/head'

function loadScript(src, attrs = {}) {
  if (typeof document !== 'undefined') {
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    Object.keys(attrs).forEach(attr => (script[attr] = attrs[attr]))
    script.src = src
    document.head.appendChild(script)
  }
}

function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    loadScript('https://buttons.github.io/buttons.js')
    loadScript('https://tanstack.ck.page/e394781e7a/index.js', {
      'data-uid': 'e394781e7a',
    })
  }, [])

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
