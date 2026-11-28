import { QueryClient, dehydrate, noop, query } from '@tanstack/react-query'
import React from 'react'
import { Header, InfoBox, Layout, PostList } from '../components'
import { postsQueries } from '../services/posts/queries'

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
  const queryClient = new QueryClient()

  await query(queryClient, postsQueries.list(10)).catch(noop)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

export default Home
