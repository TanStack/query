<script setup lang="ts">
import { computed } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'
import { productsQueries } from './services/products/queries'

type Product = {
  name: string
  shortDescription: string
  salePrice: number
}

const props = withDefaults(defineProps<{ query?: string }>(), { query: '' })

const {
  isLoading,
  status,
  error,
  isFetching,
  data,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
} = useInfiniteQuery(() => ({
  ...productsQueries.search<Product>({
    indexName: 'bestbuy',
    query: props.query,
    hitsPerPage: 5,
  }),
  staleTime: 30 * 1000, // 30s
  gcTime: 15 * 60 * 1000, // 15m
}))

const products = computed(() => data.value?.pages.flatMap((page) => page.hits))
</script>

<template>
  <template v-if="query">
    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-else-if="status === 'error'">Error: {{ error?.message }}</div>
    <div v-else>
      <div class="search-status">
        Status: {{ status }}
        <span v-if="isFetching">fetching...</span>
      </div>
      <div>
        <div class="search-result">
          <template v-if="products && products.length > 0">
            <li
              v-for="product in products"
              :key="product.objectID"
              class="product"
            >
              <span class="product-name">{{ product.name }}</span>
              <template v-if="product.shortDescription">
                <br />
                <span class="product-description">
                  {{ product.shortDescription }}
                </span>
              </template>
              <br />
              <span class="product-price">${{ product.salePrice }}</span>
            </li>
          </template>
          <h3 v-else>No products found!</h3>
        </div>
        <button
          v-if="hasNextPage"
          type="button"
          class="search-more"
          :disabled="isFetching"
          @click="fetchNextPage()"
        >
          more
        </button>
        <div v-if="isFetchingNextPage" class="search-status">
          Fetching next page...
        </div>
      </div>
    </div>
  </template>
</template>
