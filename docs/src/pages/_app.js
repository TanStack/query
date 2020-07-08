import '@docsearch/react/dist/style.css'
import '../styles/index.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script async defer src="https://buttons.github.io/buttons.js" />
      </Head>
      <>
        <Component {...pageProps} />
        <script
          async
          defer
          data-uid="e394781e7a"
          src="https://tanstack.ck.page/e394781e7a/index.js"
        />
      </>
    </>
  )
}

export default MyApp
