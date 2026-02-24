import React from 'react';
import {
  GestureResponderHandlers,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { PRICE_PRESET_OPTIONS, STAR_PANEL_OPTIONS } from '../constants';
import { searchStyles as styles } from '../styles';

type Props = {
  visible: boolean;
  sheetStyle: StyleProp<ViewStyle>;
  draftStar?: number;
  draftMinPrice: string;
  draftMaxPrice: string;
  selectedPresetLabel?: string;
  minThumbOffset: number;
  maxThumbOffset: number;
  minThumbPanHandlers: GestureResponderHandlers;
  maxThumbPanHandlers: GestureResponderHandlers;
  onClose: () => void;
  onTrackLayout: (event: LayoutChangeEvent) => void;
  onChangeMinPriceInput: (value: string) => void;
  onChangeMaxPriceInput: (value: string) => void;
  onSelectPricePreset: (min?: number, max?: number) => void;
  onToggleStar: (value: number) => void;
  onClear: () => void;
  onApply: () => void;
};

export function PriceStarSheet({
  visible,
  sheetStyle,
  draftStar,
  draftMinPrice,
  draftMaxPrice,
  selectedPresetLabel,
  minThumbOffset,
  maxThumbOffset,
  minThumbPanHandlers,
  maxThumbPanHandlers,
  onClose,
  onTrackLayout,
  onChangeMinPriceInput,
  onChangeMaxPriceInput,
  onSelectPricePreset,
  onToggleStar,
  onClear,
  onApply,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalMaskBottom}>
        <View style={sheetStyle}>
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} style={styles.sheetCloseBtn}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </Pressable>
            <Text style={styles.sheetTitle}>选择价格/星级</Text>
            <View style={styles.sheetHeaderSpace} />
          </View>

          <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSectionTitle}>价格</Text>
            <View style={styles.sliderTrack} onLayout={onTrackLayout}>
              <View style={styles.sliderTrackBase} />
              <View
                style={[
                  styles.sliderTrackActive,
                  {
                    left: minThumbOffset,
                    width: Math.max(maxThumbOffset - minThumbOffset, 0),
                  },
                ]}
              />
              <View {...minThumbPanHandlers} style={[styles.sliderThumb, { left: minThumbOffset - 14 }]}>
                <Text style={styles.sliderThumbText}>⫶</Text>
              </View>
              <View {...maxThumbPanHandlers} style={[styles.sliderThumb, { left: maxThumbOffset - 14 }]}>
                <Text style={styles.sliderThumbText}>⫶</Text>
              </View>
            </View>

            <View style={styles.priceInputsWrap}>
              <View style={styles.priceField}>
                <Text style={styles.priceFieldLabel}>最低</Text>
                <View style={styles.priceInputLine}>
                  <Text style={styles.pricePrefix}>¥</Text>
                  <TextInput
                    value={draftMinPrice}
                    onChangeText={onChangeMinPriceInput}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#9eacbc"
                    style={styles.priceFieldInput}
                  />
                </View>
              </View>
              <Text style={styles.priceFieldDash}>—</Text>
              <View style={styles.priceField}>
                <Text style={styles.priceFieldLabel}>最高</Text>
                <View style={styles.priceInputLine}>
                  <Text style={styles.pricePrefix}>¥</Text>
                  <TextInput
                    value={draftMaxPrice}
                    onChangeText={onChangeMaxPriceInput}
                    keyboardType="number-pad"
                    placeholder="850以上"
                    placeholderTextColor="#9eacbc"
                    style={styles.priceFieldInput}
                  />
                </View>
              </View>
            </View>

            <View style={styles.presetGrid}>
              {PRICE_PRESET_OPTIONS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => onSelectPricePreset(item.min, item.max)}
                  style={[
                    styles.presetChip,
                    selectedPresetLabel === item.label ? styles.presetChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      selectedPresetLabel === item.label ? styles.presetChipTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.starTitleRow}>
              <Text style={styles.filterSectionTitle}>星级/钻级</Text>
            </View>

            <View style={styles.starGrid}>
              {STAR_PANEL_OPTIONS.map((item) => {
                const selected = item.value === 2 ? draftStar === 1 || draftStar === 2 : draftStar === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => onToggleStar(item.value)}
                    style={[styles.starCard, selected ? styles.starCardActive : null]}
                  >
                    <Text style={[styles.starCardTitle, selected ? styles.starCardTitleActive : null]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.starCardDesc, selected ? styles.starCardDescActive : null]}>
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <Pressable onPress={onClear} style={[styles.footerBtn, styles.footerBtnLight]}>
              <Text style={styles.footerBtnLightText}>清空</Text>
            </Pressable>
            <Pressable onPress={onApply} style={[styles.footerBtn, styles.footerBtnPrimary]}>
              <Text style={styles.footerBtnPrimaryText}>完成</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
