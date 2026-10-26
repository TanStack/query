import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, TouchableRipple } from 'react-native-paper'
import type { Movie } from '../services/movies/types'

type Props = {
  item: Movie
  onPress: (item: Movie) => void
}

export function ListItem({ item, onPress }: Props) {
  return (
    <TouchableRipple onPress={() => onPress(item)} accessibilityRole="button">
      <View style={styles.item}>
        <View style={styles.firstRow}>
          <Text variant="bodyMedium" style={styles.title}>
            {item.title}
          </Text>
        </View>
        <View style={styles.secondRow}>
          <Text variant="bodyMedium">{item.year}</Text>
        </View>
      </View>
    </TouchableRipple>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingRight: 10,
    paddingLeft: 30,
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 10,
  },
  firstRow: {
    marginTop: 5,
    marginBottom: 5,
  },
  secondRow: {
    marginBottom: 10,
  },
  title: { fontWeight: 'bold' },
})
