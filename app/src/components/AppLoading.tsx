import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type AppLoadingProps = {
  label?: string;
};

export function AppLoading({ label = '加载中...' }: AppLoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.brandBlue} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  label: {
    marginTop: spacing.xs,
    color: colors.ink500,
    fontSize: 13,
  },
});
