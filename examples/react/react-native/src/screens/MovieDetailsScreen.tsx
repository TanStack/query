import * as React from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage'
import { useRefreshByUser } from '../hooks/useRefreshByUser'
import { moviesQueries } from '../services/movies/queries'
import type { Movie, MovieDetails } from '../services/movies/types'
import type { MoviesStackNavigator } from '../navigation/types'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RouteProp } from '@react-navigation/native'

type MoviesDetailsScreenNavigationProp = StackNavigationProp<
  MoviesStackNavigator,
  'MovieDetails'
>

type Props = {
  navigation: MoviesDetailsScreenNavigationProp
  route: RouteProp<MoviesStackNavigator, 'MovieDetails'>
}

export function MovieDetailsScreen({ route }: Props) {
  const { title } = route.params
  const queryClient = useQueryClient()
  const movieDetailQuery = moviesQueries.detail(title)
  const { isPending, isError, error, data, refetch } = useQuery<
    Movie | MovieDetails,
    Error,
    Movie | MovieDetails,
    typeof movieDetailQuery.queryKey
  >({
    queryKey: movieDetailQuery.queryKey,
    queryFn: movieDetailQuery.queryFn,
    placeholderData: () =>
      queryClient
        .getQueryData(moviesQueries.list().queryKey)
        ?.find((movie) => movie.title === title),
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  if (isPending) return <LoadingIndicator />
  if (isError) return <ErrorMessage message={error.message}></ErrorMessage>

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetchingByUser}
          onRefresh={refetchByUser}
        />
      }
    >
      <View style={styles.titleRow}>
        <Text variant="titleLarge">
          {data.title} ({data.year})
        </Text>
      </View>
      {'info' in data ? (
        <>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium">{data.info.plot}</Text>
          </View>
          <View style={styles.actorsRow}>
            <Text variant="bodyMedium">
              {data.info.actors.slice(0, -1).join(', ') +
                ' or ' +
                data.info.actors.slice(-1)}
            </Text>
          </View>
        </>
      ) : (
        <LoadingIndicator />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    margin: 20,
  },
  infoRow: {
    flexDirection: 'row',
    margin: 20,
  },
  actorsRow: {
    flexDirection: 'column',
    margin: 20,
    marginTop: 10,
  },
})
