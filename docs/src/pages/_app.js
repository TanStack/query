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
        <script async defer src="https://buttons.github.io/buttons.js"></script>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
