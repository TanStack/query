---
'@tanstack/solid-query': patch
---

fix: finish server renders that read a disabled query. Reading `.data` from a
`useQuery` with `enabled: false` and nothing cached stopped an SSR render from
ever completing — no bytes at all, since the data node was handed a promise
that can never settle. That parking is intended client behaviour (the reader
suspends into the nearest `<Loading>` until an enable, refetch or cache write
revives the compute), but on the server there is no later: the render has to
finish, and nothing will enable the query or write the cache before it does.
A disabled query with no data now commits its idle state on the server, which
is the contract the scalar metadata channel already honoured and the state the
client hydrates to. Client behaviour is unchanged.
