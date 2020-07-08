import cn from 'classnames'
import { Banner } from 'components/Banner'
import { Footer } from 'components/Footer'
import markdownStyles from 'components/markdown.module.css'
import { Nav } from 'components/Nav'
import { getBlogLink, getDateStr, postIsPublished } from 'lib/blog-helpers'
import getBlogIndex from 'lib/notion/getBlogIndex'
import getNotionUsers from 'lib/notion/getNotionUsers'
import { textBlock } from 'lib/notion/renderers'
import Link from 'next/link'
import * as React from 'react'
import blogStyles from 'styles/blog.module.css'
import { Sticky } from 'components/Sticky'
import { Seo } from 'components/Seo'

export const getStaticProps = async ({ preview }) => {
  const postsTable = await getBlogIndex()
  const authorsToGet = new Set()
  const posts = Object.keys(postsTable)
    .map(slug => {
      const post = postsTable[slug] // remove draft posts in production

      if (!preview && !postIsPublished(post)) {
        return null
      }

      post.Authors = post.Authors || []

      for (const author of post.Authors) {
        authorsToGet.add(author)
      }

      return post
    })
    .filter(Boolean)
  const { users } = await getNotionUsers([...authorsToGet])
  posts.map(post => {
    post.Authors = post.Authors.map(id => users[id].full_name)
  })
  return {
    props: {
      preview: preview || false,
      posts,
    },
    unstable_revalidate: 10,
  }
}

export default function BlogIndex({ posts = [], preview }) {
  return (
    <div className="h-full min-h-full">
      <Banner />
      <Sticky>
        <Nav />
      </Sticky>
      <Seo
        title="Blog"
        description="Stories, tips, and tools to inspire you to build better software."
      />
      {preview && (
        <div className={blogStyles.previewAlertContainer}>
          <div className={blogStyles.previewAlert}>
            <b>Note:</b>
            {` `}Viewing in preview mode{' '}
            <Link href={`/api/clear-preview`}>
              <button className={blogStyles.escapePreview}>Exit Preview</button>
            </Link>
          </div>
        </div>
      )}
      <div className="bg-white pt-16 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="relative ">
          <div>
            <h1 className="text-3xl leading-9 tracking-tight font-extrabold text-gray-900 sm:text-4xl sm:leading-10 ">
              Blog
            </h1>
            <div className="mt-3 sm:mt-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-center">
              <p className="text-xl leading-7 text-gray-500">
                Stories, tips, and tools to inspire you to build better
                software. Subscribe for updates.
              </p>
              <form
                action=""
                method="post"
                className="mt-6 flex lg:mt-0 lg:justify-end"
              >
                <input type="hidden" name="_honeypot" value="" />
                <input
                  aria-label="Email address"
                  type="email"
                  name="email"
                  required
                  className="appearance-none w-full px-4 py-2 border border-gray-300 text-base leading-6 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out lg:max-w-xs"
                  placeholder="Enter your email"
                />
                <span className="ml-3 flex-shrink-0 inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                  >
                    Notify me
                  </button>
                </span>
              </form>
            </div>
          </div>
          <div className={markdownStyles['markdown']}>
            {posts.length === 0 && (
              <p className={blogStyles.noPosts}>There are no posts yet</p>
            )}
            <div className="mt-6 grid gap-16 border-t border-gray-100 pt-10 lg:grid-cols-2 lg:col-gap-5 lg:row-gap-12">
              {posts.map(post => {
                return (
                  <div key={post.Slug} className="space-y-2  pb-6">
                    {post.Date && (
                      <div className="posted text-gray-500 leading-5 text-sm">
                        <time dateTime={getDateStr(post.Date)}>
                          {getDateStr(post.Date)}
                        </time>
                      </div>
                    )}
                    <h3 className="mt-2 text-2xl leading-7 font-semibold text-gray-900">
                      <Link href="/blog/[...slug]" as={getBlogLink(post.Slug)}>
                        <a className="block">
                          <span className="hover:underline cursor-pointer">
                            {!post.Published && (
                              <span className={blogStyles.draftBadge}>
                                Draft
                              </span>
                            )}
                            {post.Page}
                          </span>{' '}
                        </a>
                      </Link>
                    </h3>
                    <div className=" mt-3  leading-6 text-gray-500">
                      <div
                        className={cn(markdownStyles.markdown, 'text-gray-500')}
                      >
                        {(!post.preview || post.preview.length === 0) &&
                          'No preview available'}
                        {(post.preview || []).map((block, idx) => (
                          <p key={`preview-${post.Slug}-${idx}`}>
                            {textBlock(block, true, `${post.Slug}${idx}`)}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Link href="/blog/[...slug]" as={getBlogLink(post.Slug)}>
                        <a className="text-base leading-6 font-semibold text-blue-600 hover:text-blue-500 transition ease-in-out duration-150">
                          Read More <span aria-hidden="true">→</span>
                        </a>
                      </Link>
                    </div>
                    {/* {post.Authors.length > 0 && (
                  <div className="authors">By: {post.Authors.join(' ')}</div>
                  )} */}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
