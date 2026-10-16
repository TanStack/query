import * as React from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Paragraph, Title } from 'react-native-paper'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage'
import { useRefreshByUser } from '../hooks/useRefreshByUser'
import { fetchMovie } from '../lib/api'
import type { Movie, MovieDetails } from '../lib/api'
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
  const { isPending, error, data, refetch } = useQuery<Movie | MovieDetails>({
    queryKey: ['movie', title],
    queryFn: () => fetchMovie(title),
    placeholderData: () =>
      queryClient
        .getQueryData<Array<Movie>>(['movies'])
        ?.find((movie) => movie.title === title),
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  if (isPending) return <LoadingIndicator />
  if (error) return <ErrorMessage message={error.message}></ErrorMessage>

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
        <Title>
          {data.title} ({data.year})
        </Title>
      </View>
      {'info' in data ? (
        <>
          <View style={styles.infoRow}>
            <Paragraph>{data.info.plot}</Paragraph>
          </View>
          <View style={styles.actorsRow}>
            <Paragraph>
              {data.info.actors.slice(0, -1).join(', ') +
                ' or ' +
                data.info.actors.slice(-1)}
            </Paragraph>
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
