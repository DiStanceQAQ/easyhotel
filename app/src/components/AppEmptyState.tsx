import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type AppEmptyStateProps = {
  title?: string;
  description?: string;
};

export function AppEmptyState({
  title = '暂无数据',
  description = '你可以调整筛选条件后重试',
}: AppEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.ink900,
    fontWeight: '700',
    fontSize: 16,
  },
  description: {
    marginTop: spacing.xs,
    color: colors.ink500,
    fontSize: 13,
  },
});
