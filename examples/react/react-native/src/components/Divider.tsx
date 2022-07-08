import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Divider as PaperDivider } from 'react-native-paper';

export function Divider() {
  return <PaperDivider style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    marginLeft: 10,
  },
});
