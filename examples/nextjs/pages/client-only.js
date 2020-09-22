import React from 'react'
import { Layout, Header, InfoBox, PostList } from '../components'

const ClientOnly = () => {
  return (
    <Layout>
      <Header />
      <InfoBox>
        ℹ️ If you reload this page, you will see a loader since we didn't fetch
        any data on the server.
      </InfoBox>
      <PostList isClient={true} />
    </Layout>
  )
}

export default ClientOnly
