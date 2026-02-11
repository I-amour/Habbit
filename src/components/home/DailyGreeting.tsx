import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { getGreeting } from '../../utils/dates';

export function DailyGreeting() {
  const theme = useTheme();
  const greeting = getGreeting();
  const today = format(new Date(), 'EEEE, MMMM d');

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.greeting, { color: theme.text }]}>{greeting}!</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{today}</Text>
        </View>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
  },
  date: {
    fontSize: 15,
    marginTop: 4,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
});
