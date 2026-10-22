import React from 'react'
import { QueryClient, dehydrate, noop } from '@tanstack/react-query'
import { Header, InfoBox, Layout, PostList } from '../components'
import { postsQueryOptions } from '../hooks/usePosts'

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

  await queryClient.query(postsQueryOptions(10)).catch(noop)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

export default Home
