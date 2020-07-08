import ReactJSXParser from '@zeit/react-jsx-parser'
import Heading from 'components/blog/Heading'
import { Footer } from 'components/Footer'
import styles from 'components/markdown.module.css'
import { Sticky } from 'components/Sticky'
import { useMediaQuery } from 'components/useIsMobile'
import Link from 'next/link'
import { useRouter } from 'next/router'
import fetch from 'node-fetch'
import React, { useEffect } from 'react'
import { Banner } from '../../components/Banner'
import components from '../../components/blog/dynamic'
import { Nav } from '../../components/Nav'
import { getBlogLink, getDateStr } from '../../lib/blog-helpers'
import getBlogIndex from '../../lib/notion/getBlogIndex'
import getNotionUsers from '../../lib/notion/getNotionUsers'
import getPageData from '../../lib/notion/getPageData'
import { textBlock } from '../../lib/notion/renderers'
import blogStyles from '../../styles/blog.module.css'
import postStyles from '../../styles/post.module.css'
import { Seo } from 'components/Seo' // Get the data for each blog post

export const getStaticProps = async ({
  // @ts-ignore
  params: { slug },
  preview,
}) => {
  // load the postsTable so that we can get the page's ID
  const postsTable = await getBlogIndex()
  const post = postsTable[slug] // if we can't find the post or if it is unpublished and
  // viewed without preview mode then we just redirect to /blog

  if (!post || (post.Published !== 'Yes' && !preview)) {
    console.log(`Failed to find post for slug: ${slug}`)
    return {
      props: {
        redirect: '/blog',
        preview: false,
      },
      revalidate: 5,
    }
  }

  const postData = await getPageData(post.id)
  post.content = postData.blocks

  for (let i = 0; i < postData.blocks.length; i++) {
    const { value } = postData.blocks[i]
    const { type, properties } = value

    if (type == 'tweet') {
      const src = properties.source[0][0] // parse id from https://twitter.com/_ijjk/status/TWEET_ID format

      const tweetId = src.split('/')[5].split('?')[0]
      if (!tweetId) continue

      try {
        const res = await fetch(
          `https://api.twitter.com/1/statuses/oembed.json?id=${tweetId}`
        )
        const json = await res.json()
        properties.html = json.html.split('<script')[0]
        post.hasTweet = true
      } catch (_) {
        console.log(`Failed to get tweet embed for ${src}`)
      }
    }
  }

  const { users } = await getNotionUsers(post.Authors || [])
  post.Authors = Object.keys(users).map(id => users[id].full_name)
  return {
    props: {
      post,
      preview: preview || false,
    },
    unstable_revalidate: 10,
  }
} // Return our list of blog posts to prerender

export async function getStaticPaths() {
  const postsTable = await getBlogIndex() // we fallback for any unpublished posts to save build time
  // for actually published ones

  return {
    paths: Object.keys(postsTable)
      .filter(post => postsTable[post].Published === 'Yes')
      .map(slug => getBlogLink(slug)),
    fallback: true,
  }
}
const listTypes = new Set(['bulleted_list', 'numbered_list'])

const RenderPost = ({ post, redirect, preview }) => {
  const router = useRouter()
  let listTagName = null
  let listLastId = null
  let listMap = {}
  const isMobile = useMediaQuery(1100)
  useEffect(() => {
    const twitterSrc = 'https://platform.twitter.com/widgets.js' // make sure to initialize any new widgets loading on
    // client navigation

    if (post && post.hasTweet) {
      if (window?.twttr?.widgets) {
        window.twttr.widgets.load()
      } else if (!document.querySelector(`script[src="${twitterSrc}"]`)) {
        const script = document.createElement('script')
        script.async = true
        script.src = twitterSrc
        document.querySelector('body')?.appendChild(script)
      }
    }
  }, [])
  useEffect(() => {
    if (redirect && !post) {
      router.replace(redirect)
    }
  }, [redirect, post]) // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running

  if (router.isFallback) {
    return <div>Loading...</div>
  } // if you don't have a post at this point, and are not
  // loading one from fallback then  redirect back to the index

  if (!post) {
    return (
      <div className={blogStyles.post}>
        <p>
          Woops! didn't find that post, redirecting you back to the blog index
        </p>
      </div>
    )
  }

  return (
    <div className="h-full min-h-full">
      <Banner />
      <Sticky className="z-20">
        <Nav />
      </Sticky>
      <Seo title={post.Page} />
      {/* <Header titlePre={post.Page} /> */}
      {preview && (
        <div className={blogStyles.previewAlertContainer}>
          <div className={blogStyles.previewAlert}>
            <b>Note:</b>
            {` `}Viewing in preview mode{' '}
            <Link href={`/api/clear-preview?slug=${post.Slug}`}>
              <button className={blogStyles.escapePreview}>Exit Preview</button>
            </Link>
          </div>
        </div>
      )}
      <div className="container max-w-3xl  mx-auto px-4 sm:px-6 lg:px-8 max-w-screen pb-12 pt-6">
        <div className="my-10 space-y-4">
          <div className=" flex items-center">
            {post.Authors.length > 0 && (
              <div className="authors text-gray-700 mr-1">
                By {post.Authors.join(' ')}{' '}
              </div>
            )}
            {post.Date && (
              <div className="posted text-gray-700">
                {' '}
                • {getDateStr(post.Date)}
              </div>
            )}
          </div>
          <h1 className="text-5xl max-w-3xl leading-snug tracking-tighter text-gray-900 font-semibold">
            {post.Page || ''}
          </h1>
        </div>

        <div className="relative">
          <div className="mx-auto">
            <div className={`${postStyles.post} ${styles['markdown']} `}>
              {(!post.content || post.content.length === 0) && (
                <p>This post has no content</p>
              )}

              {(post.content || []).map((block, blockIdx) => {
                const { value } = block
                const { type, properties, id, parent_id } = value
                const isLast = blockIdx === post.content.length - 1
                const isList = listTypes.has(type)
                let toRender = []

                if (isList) {
                  listTagName =
                    components[type === 'bulleted_list' ? 'ul' : 'ol']
                  listLastId = `list${id}`
                  listMap[id] = {
                    key: id,
                    nested: [],
                    children: textBlock(properties.title, true, id),
                  }

                  if (listMap[parent_id]) {
                    listMap[id].isNested = true
                    listMap[parent_id].nested.push(id)
                  }
                }

                if (listTagName && (isLast || !isList)) {
                  toRender.push(
                    React.createElement(
                      listTagName,
                      {
                        key: listLastId,
                      },
                      Object.keys(listMap).map(itemId => {
                        if (listMap[itemId].isNested) return null

                        const createEl = item =>
                          React.createElement(
                            components.li || 'ul',
                            {
                              key: item.key,
                            },
                            item.children,
                            item.nested.length > 0
                              ? React.createElement(
                                  components.ul || 'ul',
                                  {
                                    key: item + 'sub-list',
                                  },
                                  item.nested.map(nestedId =>
                                    createEl(listMap[nestedId])
                                  )
                                )
                              : null
                          )

                        return createEl(listMap[itemId])
                      })
                    )
                  )
                  listMap = {}
                  listLastId = null
                  listTagName = null
                }

                const renderHeading = Type => {
                  toRender.push(
                    <Heading key={id}>
                      <Type key={id}>
                        {textBlock(properties.title, true, id)}
                      </Type>
                    </Heading>
                  )
                }

                switch (type) {
                  case 'page':
                  case 'divider':
                    break

                  case 'text':
                    if (properties) {
                      toRender.push(textBlock(properties.title, false, id))
                    }

                    break

                  case 'image':
                  case 'video':
                  case 'embed': {
                    const { format = {} } = value
                    const {
                      block_width,
                      block_height,
                      display_source,
                      block_aspect_ratio,
                    } = format
                    const baseBlockWidth = 768
                    const roundFactor = Math.pow(10, 2) // calculate percentages

                    const width = block_width
                      ? `${
                          Math.round(
                            (block_width / baseBlockWidth) * 100 * roundFactor
                          ) / roundFactor
                        }%`
                      : block_height || '100%'
                    const isImage = type === 'image'
                    const Comp = isImage ? 'img' : 'video'
                    const useWrapper = !!block_aspect_ratio
                    const childStyle = useWrapper
                      ? {
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          margin: 0,
                        }
                      : {
                          width,
                          border: 'none',
                          height: block_height,
                          display: 'block',
                          maxWidth: '100%',
                        }
                    let child = null

                    if (!isImage && !value.file_ids) {
                      // external resource use iframe
                      child = (
                        <iframe
                          style={childStyle}
                          src={display_source}
                          key={!useWrapper ? id : undefined}
                          className={!useWrapper ? 'asset-wrapper' : undefined}
                        />
                      )
                    } else {
                      // notion resource
                      child = (
                        <Comp
                          key={!useWrapper ? id : undefined}
                          src={`/api/asset?assetUrl=${encodeURIComponent(
                            display_source
                          )}&blockId=${id}`}
                          controls={!isImage}
                          alt={`An ${isImage ? 'image' : 'video'} from Notion`}
                          loop={!isImage}
                          muted={!isImage}
                          autoPlay={!isImage}
                          style={childStyle}
                        />
                      )
                    }

                    toRender.push(
                      useWrapper ? (
                        <div
                          style={{
                            paddingTop: `${Math.round(
                              block_aspect_ratio * 100
                            )}%`,
                            position: 'relative',
                          }}
                          className="asset-wrapper"
                          key={id}
                        >
                          {child}
                        </div>
                      ) : (
                        child
                      )
                    )
                    break
                  }

                  case 'header':
                    renderHeading('h1')
                    break

                  case 'sub_header':
                    renderHeading('h2')
                    break

                  case 'sub_sub_header':
                    renderHeading('h3')
                    break

                  case 'code': {
                    if (properties.title) {
                      const content = properties.title[0][0]
                      const language = properties.language[0][0]

                      if (language === 'LiveScript') {
                        // this requires the DOM for now
                        toRender.push(
                          <ReactJSXParser
                            key={id}
                            jsx={content}
                            components={components}
                            componentsOnly={false}
                            renderInpost={false}
                            allowUnknownElements={true}
                            blacklistedTags={['script', 'style']}
                          />
                        )
                      } else {
                        toRender.push(
                          <components.Code key={id} language={language || ''}>
                            {content}
                          </components.Code>
                        )
                      }
                    }

                    break
                  }

                  case 'quote': {
                    if (properties.title) {
                      toRender.push(
                        React.createElement(
                          components.blockquote,
                          {
                            key: id,
                          },
                          properties.title
                        )
                      )
                    }

                    break
                  }

                  case 'callout': {
                    toRender.push(
                      <div className="callout" key={id}>
                        {value.format?.page_icon && (
                          <div>{value.format?.page_icon}</div>
                        )}
                        <div className="text">
                          {textBlock(properties.title, true, id)}
                        </div>
                      </div>
                    )
                    break
                  }

                  case 'tweet': {
                    if (properties.html) {
                      toRender.push(
                        <div
                          dangerouslySetInnerHTML={{
                            __html: properties.html,
                          }}
                          key={id}
                        />
                      )
                    }

                    break
                  }

                  default:
                    if (
                      process.env.NODE_ENV !== 'production' &&
                      !listTypes.has(type)
                    ) {
                      console.log('unknown type', type)
                    }

                    break
                }

                return toRender
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default RenderPost
