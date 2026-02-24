import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { hotelDetailStyles as styles } from '../styles';

type Props = {
  style: StyleProp<ViewStyle>;
  totalPrice: number | null;
  summaryText: string;
  hintText?: string;
  mainLabel?: string;
  mainDisabled?: boolean;
  onPressMain: () => void;
  onPressAsk: () => void;
};

export function DetailBottomBar({
  style,
  totalPrice,
  summaryText,
  hintText,
  mainLabel = '查看房型',
  mainDisabled = false,
  onPressMain,
  onPressAsk,
}: Props) {
  return (
    <View style={style}>
      <Pressable style={styles.askButton} onPress={onPressAsk}>
        <Text style={styles.askIcon}>◍</Text>
        <Text style={styles.askText}>问酒店</Text>
      </Pressable>

      <View style={styles.priceWrap}>
        <Text style={styles.selectionSummary}>{summaryText}</Text>
        <View style={styles.priceRowCompact}>
          <Text style={styles.bottomPrice}>{`¥${totalPrice ?? '--'}`}</Text>
        </View>
        {hintText ? <Text style={styles.selectionHint}>{hintText}</Text> : null}
      </View>
      <Pressable
        style={[styles.mainButton, mainDisabled ? styles.mainButtonDisabled : null]}
        onPress={onPressMain}
        disabled={mainDisabled}
      >
        <Text style={styles.mainButtonText}>{mainLabel}</Text>
      </Pressable>
    </View>
  );
}
