import * as React from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Paragraph, Title } from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { ErrorMessage } from '../components/ErrorMessage'
import { useRefreshByUser } from '../hooks/useRefreshByUser'
import { fetchMovie } from '../lib/api'
import type { MovieDetails } from '../lib/api'
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
  const { isPending, error, data, refetch } = useQuery<MovieDetails, Error>({
    queryKey: ['movie', route.params.movie.title],
    queryFn: () => fetchMovie(route.params.movie.title),
    initialData: route.params.movie as MovieDetails,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  if (isPending) return <LoadingIndicator />
  if (error) return <ErrorMessage message={error.message}></ErrorMessage>
  if (!data) return null

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
      {data.info ? (
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
