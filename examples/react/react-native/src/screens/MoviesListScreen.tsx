import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage'
import { Divider } from '../components/Divider'
import { ListItem } from '../components/ListItem'
import { useRefreshByUser } from '../hooks/useRefreshByUser'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { moviesQueries } from '../services/movies/queries'
import type { Movie } from '../services/movies/types'
import type { MoviesStackNavigator } from '../navigation/types'
import type { StackNavigationProp } from '@react-navigation/stack'

type MoviesListScreenNavigationProp = StackNavigationProp<
  MoviesStackNavigator,
  'MoviesList'
>

type Props = {
  navigation: MoviesListScreenNavigationProp
}

export function MoviesListScreen({ navigation }: Props) {
  const { isPending, isError, error, data, refetch } = useQuery(
    moviesQueries.list(),
  )
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)
  useRefreshOnFocus()

  const onListItemPress = React.useCallback(
    (movie: Movie) => {
      navigation.navigate('MovieDetails', {
        title: movie.title,
      })
    },
    [navigation],
  )

  const renderItem = React.useCallback(
    ({ item }: { item: Movie }) => {
      return <ListItem item={item} onPress={onListItemPress} />
    },
    [onListItemPress],
  )

  if (isPending) return <LoadingIndicator />

  if (isError) return <ErrorMessage message={error.message}></ErrorMessage>
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.title}
      ItemSeparatorComponent={() => <Divider />}
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingByUser}
          onRefresh={refetchByUser}
        />
      }
    ></FlatList>
  )
}
