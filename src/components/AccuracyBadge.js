import { StyleSheet, Text, View } from 'react-native';

import colors from '../constants/colors';

export default function AccuracyBadge({ label = 'GPS non démarré', status = 'idle' }) {
  const statusStyle = status === 'good' ? styles.good : status === 'warning' ? styles.warning : styles.idle;

  return (
    <View style={[styles.badge, statusStyle]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  idle: {
    backgroundColor: colors.surfaceAlt,
  },
  good: {
    backgroundColor: '#DFF3E3',
  },
  warning: {
    backgroundColor: '#FFF3CD',
  },
  text: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
