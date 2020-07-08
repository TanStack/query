import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'

const ogImage = require('images/react-query-og.png?url')
const favicon = require('images/favicon.png?url')

export const Seo = withRouter(
  ({ title, description, image = ogImage, router, children }) => (
    <Head>
      {/* DEFAULT */}

      {title != undefined && (
        <title key="title">{title} | React Query | TanStack</title>
      )}
      {description != undefined && (
        <meta name="description" key="description" content={description} />
      )}
      <link rel="icon" type="image/x-icon" href={favicon} />
      <link rel="apple-touch-icon" href={favicon} />

      {/* OPEN GRAPH */}
      <meta property="og:type" key="og:type" content="website" />
      <meta
        property="og:url"
        key="og:url"
        content={`https://react-query.tanstack.com${router.pathname}`}
      />
      {title != undefined && (
        <meta property="og:title" content={title} key="og:title" />
      )}
      {description != undefined && (
        <meta
          property="og:description"
          key="og:description"
          content={description}
        />
      )}
      {image != undefined && (
        <meta
          property="og:image"
          key="og:image"
          content={`https://react-query.tanstack.com${image}`}
        />
      )}

      {/* TWITTER */}
      <meta
        name="twitter:card"
        key="twitter:card"
        content="summary_large_image"
      />
      <meta name="twitter:site" key="twitter:site" content="@tannerlinsley" />
      <meta
        name="twitter:creator"
        key="twitter:creator"
        content="@tannerlinsley"
      />
      {title != undefined && (
        <meta name="twitter:title" key="twitter:title" content={title} />
      )}
      {description != undefined && (
        <meta
          name="twitter:description"
          key="twitter:description"
          content={description}
        />
      )}
      {image != undefined && (
        <meta
          name="twitter:image"
          key="twitter:image"
          content={`https://react-query.tanstack.com${image}`}
        />
      )}

      {children}
    </Head>
  )
)
