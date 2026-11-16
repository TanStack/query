import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { MovieDetailsScreen } from '../screens/MovieDetailsScreen'
import { MoviesListScreen } from '../screens/MoviesListScreen'
import type { MoviesStackNavigator } from './types'

const Stack = createStackNavigator<MoviesStackNavigator>()

export function MoviesStack() {
  return (
    <Stack.Navigator initialRouteName="MoviesList">
      <Stack.Screen
        name="MoviesList"
        component={MoviesListScreen}
        options={{
          headerTitle: 'Movies',
        }}
      />
      <Stack.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{
          headerTitle: 'Movie details',
        }}
      />
    </Stack.Navigator>
  )
}
