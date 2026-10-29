import { queryOptions } from '@tanstack/react-query'

export const productOptions = (slug: string) =>
  queryOptions({
    queryKey: ['products', slug],
    queryFn: async (): Promise<{
      slug: string
      name: string
      price: number
    }> => {
      const response = await fetch(`https://api.example.com/products/${slug}`)
      if (!response.ok) throw new Error('Failed to fetch product')
      return response.json()
    },
  })
