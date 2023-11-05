import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'

import { StackNavigationProp } from '@react-navigation/stack'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage'
import { Divider } from '../components/Divider'
import { ListItem } from '../components/ListItem'
import { useRefreshByUser } from '../hooks/useRefreshByUser'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { fetchMovies, Movie } from '../lib/api'
import { MoviesStackNavigator } from '../navigation/types'

type MoviesListScreenNavigationProp = StackNavigationProp<
  MoviesStackNavigator,
  'MoviesList'
>

type Props = {
  navigation: MoviesListScreenNavigationProp
}

export function MoviesListScreen({ navigation }: Props) {
  const { isPending, error, data, refetch } = useQuery<Movie[], Error>({
    queryKey: ['movies'],
    queryFn: fetchMovies,
  })
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)
  useRefreshOnFocus(refetch)

  const onListItemPress = React.useCallback(
    (movie) => {
      navigation.navigate('MovieDetails', {
        movie,
      })
    },
    [navigation],
  )

  const renderItem = React.useCallback(
    ({ item }) => {
      return <ListItem item={item} onPress={onListItemPress} />
    },
    [onListItemPress],
  )

  if (isPending) return <LoadingIndicator />

  if (error) return <ErrorMessage message={error.message}></ErrorMessage>

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
