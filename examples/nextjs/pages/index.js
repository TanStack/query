import React from 'react'
import { QueryCache } from 'react-query'
import { dehydrate } from 'react-query/hydration'
import { Layout, Header, InfoBox, PostList } from '../components'
import { fetchPosts } from '../hooks'

const Home = () => {
  return (
    <Layout>
      <Header />
      <InfoBox>ℹ️ This page shows how to use SSG with React-Query.</InfoBox>
      <PostList />
    </Layout>
  )
}

export async function getStaticProps() {
  const queryCache = new QueryCache()
  await queryCache.prefetchQuery(['posts', 10], fetchPosts)

  return {
    props: {
      dehydratedState: dehydrate(queryCache),
    },
  }
}

export default Home
