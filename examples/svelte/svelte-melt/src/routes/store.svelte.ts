const init = {
	paginate: {
		page: 1,
		asc: false,
		orderWith: 'like_count',
		start: 0,
		end: 10,
		size: 12,
		totalSize: 20
	},
	filter: {
		tags: [],
		category: 'fiction',
		updated_at: 'yesterday',
		created_at: 'last 300 days'
	},
	search: {}
}
export const bookFilterStore = $state({ ...init })
