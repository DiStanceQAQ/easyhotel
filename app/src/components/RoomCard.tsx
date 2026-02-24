import { Image } from 'expo-image';
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

type RoomCardProps = {
  name: string;
  basePrice: number;
  currency: string;
  maxGuests: number;
  breakfast: boolean;
  refundable: boolean;
  areaM2: number | null;
  coverImage: string | null;
  selected?: boolean;
  onPress?: () => void;
  quantity?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
  disableIncrease?: boolean;
  disableDecrease?: boolean;
};

function RoomCardBase({
  name,
  basePrice,
  currency,
  maxGuests,
  breakfast,
  refundable,
  areaM2,
  coverImage,
  selected = false,
  onPress,
  quantity,
  onIncrease,
  onDecrease,
  disableIncrease = false,
  disableDecrease = false,
}: RoomCardProps) {
  const roomMeta = useMemo(
    () => `${maxGuests}张床·${areaM2 ? `${areaM2}m²` : '40m²'}·${breakfast ? '含早' : '不含早'}`,
    [areaM2, breakfast, maxGuests],
  );
  const showQuantityStepper = typeof quantity === 'number' && (onIncrease || onDecrease);

  return (
    <Pressable
      style={[styles.card, selected ? styles.cardSelected : null]}
      onPress={onPress}
      disabled={!onPress}
      testID="room-card"
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Image
        source={{
          uri:
            coverImage ||
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
        }}
        style={styles.image}
        contentFit="cover"
        transition={120}
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta}>{roomMeta}</Text>
        <View style={styles.badges}>
          <Text style={styles.badge}>{breakfast ? '含早餐' : '无早餐'}</Text>
          <Text style={styles.badge}>{refundable ? '可免费取消' : '不可取消'}</Text>
          <Text style={styles.badge}>入住后付款</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Text style={styles.pricePrefix}>{currency === 'CNY' ? '¥' : ''}</Text>
            <Text style={styles.price}>{basePrice}</Text>
            <Text style={styles.priceSuffix}>起</Text>
          </View>
          {showQuantityStepper ? (
            <View style={styles.quantityStepper}>
              <Pressable
                onPress={onDecrease}
                disabled={disableDecrease || !onDecrease}
                style={[
                  styles.quantityButton,
                  disableDecrease || !onDecrease ? styles.quantityButtonDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.quantityButtonText,
                    disableDecrease || !onDecrease ? styles.quantityButtonTextDisabled : null,
                  ]}
                >
                  −
                </Text>
              </Pressable>

              <View style={styles.quantityValueWrap}>
                <Text style={styles.quantityValue}>{quantity}</Text>
              </View>

              <Pressable
                onPress={onIncrease}
                disabled={disableIncrease || !onIncrease}
                style={[
                  styles.quantityButton,
                  disableIncrease || !onIncrease ? styles.quantityButtonDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.quantityButtonText,
                    disableIncrease || !onIncrease ? styles.quantityButtonTextDisabled : null,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.selectDot, selected ? styles.selectDotSelected : null]}>
              <Text style={[styles.selectDotText, selected ? styles.selectDotTextSelected : null]}>
                {selected ? '✓' : '○'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const RoomCard = memo(RoomCardBase);

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#e5ebf3',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: spacing.xs,
  },
  cardSelected: {
    borderColor: '#1f68ff',
    backgroundColor: '#f5f9ff',
  },
  image: {
    width: 86,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: '#eef3ff',
  },
  content: {
    flex: 1,
    paddingLeft: spacing.xs,
  },
  name: {
    fontSize: 15,
    color: '#223953',
    fontWeight: '700',
  },
  meta: {
    marginTop: 2,
    color: '#607d9f',
    fontSize: 11,
  },
  badges: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 10,
    color: '#4d5f79',
    backgroundColor: '#f1f4f8',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  bottomRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pricePrefix: {
    color: colors.price,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  price: {
    color: colors.price,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 25,
  },
  priceSuffix: {
    marginLeft: 4,
    color: colors.ink500,
    fontSize: 11,
    lineHeight: 18,
  },
  selectDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c6d4e8',
  },
  selectDotSelected: {
    borderColor: '#1f68ff',
    backgroundColor: '#1f68ff',
  },
  selectDotText: {
    color: '#9aa9bc',
    fontSize: 10,
    lineHeight: 10,
  },
  selectDotTextSelected: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 11,
  },
  quantityStepper: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7d5e8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f3f6fa',
  },
  quantityButtonText: {
    color: '#1d77ff',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  quantityButtonTextDisabled: {
    color: '#c5d0df',
  },
  quantityValueWrap: {
    width: 40,
    height: 34,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#d6dfec',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  quantityValue: {
    color: '#1a2f4c',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
});
