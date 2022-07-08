import * as React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MoviesStackNavigator } from './types';
import { MoviesListScreen } from '@app/screens/MoviesListScreen';
import { MovieDetailsScreen } from '@app/screens/MovieDetailsScreen';

const Stack = createStackNavigator<MoviesStackNavigator>();

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
  );
}
