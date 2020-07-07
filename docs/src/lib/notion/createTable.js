// commonjs so it can be run without transpiling
const uuid = require('uuid/v4')
const fetch = require('node-fetch')
const {
  BLOG_INDEX_ID: pageId,
  NOTION_TOKEN,
  API_ENDPOINT,
} = require('./server-constants')

async function main() {
  const userId = await getUserId()
  const transactionId = () => uuid()
  const collectionId = uuid()
  const collectionViewId = uuid()
  const viewId = uuid()
  const now = Date.now()
  const pageId1 = uuid()
  const pageId2 = uuid()
  const pageId3 = uuid()
  let existingBlockId = await getExistingexistingBlockId()

  const requestBody = {
    requestId: uuid(),
    transactions: [
      {
        id: transactionId(),
        operations: [
          {
            id: collectionId,
            table: 'block',
            path: [],
            command: 'update',
            args: {
              id: collectionId,
              type: 'collection_view',
              collection_id: collectionViewId,
              view_ids: [viewId],
              properties: {},
              created_time: now,
              last_edited_time: now,
            },
          },
          {
            id: pageId1,
            table: 'block',
            path: [],
            command: 'update',
            args: {
              id: pageId1,
              type: 'page',
              parent_id: collectionViewId,
              parent_table: 'collection',
              alive: true,
              properties: {},
              created_time: now,
              last_edited_time: now,
            },
          },
          {
            id: pageId2,
            table: 'block',
            path: [],
            command: 'update',
            args: {
              id: pageId2,
              type: 'page',
              parent_id: collectionViewId,
              parent_table: 'collection',
              alive: true,
              properties: {},
              created_time: now,
              last_edited_time: now,
            },
          },
          {
            id: pageId3,
            table: 'block',
            path: [],
            command: 'update',
            args: {
              id: pageId3,
              type: 'page',
              parent_id: collectionViewId,
              parent_table: 'collection',
              alive: true,
              properties: {},
              created_time: now,
              last_edited_time: now,
            },
          },
          {
            id: viewId,
            table: 'collection_view',
            path: [],
            command: 'update',
            args: {
              id: viewId,
              version: 0,
              type: 'table',
              name: 'Default View',
              format: {
                table_properties: [
                  { property: 'title', visible: true, width: 276 },
                  { property: 'S6_"', visible: true },
                  { property: 'la`A', visible: true },
                  { property: 'a`af', visible: true },
                  { property: 'ijjk', visible: true },
                ],
                table_wrap: true,
              },
              query2: {
                aggregations: [{ property: 'title', aggregator: 'count' }],
              },
              page_sort: [pageId1, pageId2, pageId3],
              parent_id: collectionId,
              parent_table: 'block',
              alive: true,
            },
          },
          {
            id: collectionViewId,
            table: 'collection',
            path: [],
            command: 'update',
            args: {
              id: collectionViewId,
              schema: {
                title: { name: 'Page', type: 'title' },
                'S6_"': { name: 'Slug', type: 'text' },
                'la`A': { name: 'Published', type: 'checkbox' },
                'a`af': { name: 'Date', type: 'date' },
                ijjk: { name: 'Authors', type: 'person' },
              },
              format: {
                collection_page_properties: [
                  { property: 'S6_"', visible: true },
                  { property: 'la`A', visible: true },
                  { property: 'a`af', visible: true },
                  { property: 'ijjk', visible: true },
                ],
              },
              parent_id: collectionId,
              parent_table: 'block',
              alive: true,
            },
          },
          {
            id: collectionId,
            table: 'block',
            path: [],
            command: 'update',
            args: { parent_id: pageId, parent_table: 'block', alive: true },
          },
          {
            table: 'block',
            id: pageId,
            path: ['content'],
            command: 'listAfter',
            args: {
              ...(existingBlockId
                ? {
                    after: existingBlockId,
                  }
                : {}),
              id: collectionId,
            },
          },
          {
            table: 'block',
            id: collectionId,
            path: ['created_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: collectionId,
            path: ['created_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: collectionId,
            path: ['last_edited_time'],
            command: 'set',
            args: now,
          },
          {
            table: 'block',
            id: collectionId,
            path: ['last_edited_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: collectionId,
            path: ['last_edited_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId1,
            path: ['created_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId1,
            path: ['created_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId1,
            path: ['last_edited_time'],
            command: 'set',
            args: now,
          },
          {
            table: 'block',
            id: pageId1,
            path: ['last_edited_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId1,
            path: ['last_edited_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId2,
            path: ['created_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId2,
            path: ['created_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId2,
            path: ['last_edited_time'],
            command: 'set',
            args: now,
          },
          {
            table: 'block',
            id: pageId2,
            path: ['last_edited_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId2,
            path: ['last_edited_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId3,
            path: ['created_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId3,
            path: ['created_by_table'],
            command: 'set',
            args: 'notion_user',
          },
          {
            table: 'block',
            id: pageId3,
            path: ['last_edited_time'],
            command: 'set',
            args: now,
          },
          {
            table: 'block',
            id: pageId3,
            path: ['last_edited_by_id'],
            command: 'set',
            args: userId,
          },
          {
            table: 'block',
            id: pageId3,
            path: ['last_edited_by_table'],
            command: 'set',
            args: 'notion_user',
          },
        ],
      },
    ],
  }

  const res = await fetch(`${API_ENDPOINT}/submitTransaction`, {
    method: 'POST',
    headers: {
      cookie: `token_v2=${NOTION_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    throw new Error(`Failed to add table, request status ${res.status}`)
  }
}

async function getExistingexistingBlockId() {
  const res = await fetch(`${API_ENDPOINT}/loadPageChunk`, {
    method: 'POST',
    headers: {
      cookie: `token_v2=${NOTION_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pageId,
      limit: 25,
      cursor: { stack: [] },
      chunkNumber: 0,
      verticalColumns: false,
    }),
  })

  if (!res.ok) {
    throw new Error(
      `failed to get existing block id, request status: ${res.status}`
    )
  }
  const data = await res.json()
  const id = Object.keys(data ? data.recordMap.block : {}).find(
    id => id !== pageId
  )
  return id || uuid()
}

async function getUserId() {
  const res = await fetch(`${API_ENDPOINT}/loadUserContent`, {
    method: 'POST',
    headers: {
      cookie: `token_v2=${NOTION_TOKEN}`,
      'content-type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    throw new Error(
      `failed to get Notion user id, request status: ${res.status}`
    )
  }
  const data = await res.json()
  return Object.keys(data.recordMap.notion_user)[0]
}

module.exports = main
