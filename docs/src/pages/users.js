import * as React from 'react'
import { siteConfig } from 'siteConfig'
import { Footer } from 'components/Footer'
import { Banner } from 'components/Banner'
import { Sticky } from 'components/Sticky'
import { Nav } from 'components/Nav'
import { Container } from 'components/Container'
import { Seo } from 'components/Seo'
import { users } from 'users'

const Users = props => {
  const editUrl = `${siteConfig.repoUrl}/edit/master/website2/src/siteConfig.tsx`
  const showcase = users.map(user => (
    <a
      href={user.infoLink}
      key={user.infoLink}
      className="flex items-center justify-center"
    >
      <img
        src={user.image}
        alt={user.caption}
        title={user.caption}
        style={user.style}
      />
    </a>
  ))
  return (
    <div className="bg-gray-50 h-full min-h-full">
      <Banner />
      <Sticky>
        <Nav />
      </Sticky>
      <Seo title="Showcase" />
      <Container>
        <div className="my-12 space-y-12">
          <div className="lg:text-center">
            <p className="text-base leading-6 text-blue-600 font-semibold tracking-wide uppercase">
              Showcase
            </p>
            <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 font-semibold">
              Who's using React Query?
            </h1>
            <p className="mt-4 max-w-2xl text-xl leading-7 text-gray-500 lg:mx-auto">
              React Query is consistently winning more people over in the React
              and React Native Ecosystems. It's trusted by thousands of
              developers in production including teams at Google, Paypal,
              Amazon, Walmart, Microsoft, Target and more.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-16 items-center ">
            {showcase}
          </div>
          <div className="text-center space-y-6">
            <div className="mt-4 max-w-2xl text-2xl leading-7 text-gray-900 lg:mx-auto">
              Are you using React Query?
            </div>
            <div>
              <a
                href={editUrl}
                target="_blank"
                className="w-auto items-center justify-center px-8 py-3 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue transition duration-150 ease-in-out md:py-4 md:text-lg md:px-10"
              >
                Add your company
              </a>
            </div>
          </div>
        </div>
      </Container>

      <Footer />
    </div>
  )
}

Users.displayName = 'Users'
export default Users
