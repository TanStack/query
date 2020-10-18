import React from 'react'
import { Environment, QueryCache, prefetchQuery } from 'react-query'
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
  const environment = new Environment({
    queryCache: new QueryCache(),
  })

  await prefetchQuery(environment, {
    queryKey: ['posts', 10],
    queryFn: fetchPosts,
  })

  return {
    props: {
      dehydratedState: dehydrate(environment),
    },
  }
}

export default Home
