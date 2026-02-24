import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'pill' | 'rect';
};

export function FilterChip({
  label,
  selected,
  onPress,
  variant = 'pill',
}: FilterChipProps) {
  const isRect = variant === 'rect';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        isRect ? styles.chipRect : null,
        selected ? styles.chipSelected : null,
        selected && isRect ? styles.chipSelectedRect : null,
      ]}
    >
      <Text style={[styles.text, selected ? styles.textSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  chipRect: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
    backgroundColor: '#f4f5f7',
    borderColor: '#f0f2f5',
  },
  chipSelected: {
    borderColor: '#bfd5ff',
    backgroundColor: '#edf4ff',
  },
  chipSelectedRect: {
    borderColor: '#d3e3ff',
    backgroundColor: '#eaf2ff',
  },
  text: {
    color: colors.ink700,
    fontSize: 12,
    fontWeight: '500',
  },
  textSelected: {
    color: colors.brandBlueDark,
  },
});
