import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

type AppErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function AppErrorState({
  title = '加载失败',
  description = '网络有点忙，稍后再试一下',
  onRetry,
}: AppErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>重试</Text>
        </Pressable>
      ) : null}
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink900,
  },
  description: {
    marginTop: spacing.xs,
    color: colors.ink500,
    fontSize: 13,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.brandBlue,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
