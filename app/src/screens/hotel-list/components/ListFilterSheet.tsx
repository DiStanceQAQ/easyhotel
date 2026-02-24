import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FilterChip } from '../../../components/FilterChip';
import { AppTagItem } from '../../../types/api';
import { FACILITY_OPTIONS } from '../constants';
import { hotelListStyles as styles } from '../styles';

type Props = {
  tagOptions: AppTagItem[];
  draftStar?: number;
  draftMinPrice: string;
  draftMaxPrice: string;
  draftTags: string[];
  draftFacilities: string[];
  onClose: () => void;
  onSetDraftStar: (value?: number) => void;
  onSetDraftMinPrice: (value: string) => void;
  onSetDraftMaxPrice: (value: string) => void;
  onToggleDraftTag: (name: string) => void;
  onToggleDraftFacility: (key: string) => void;
  onApply: () => void;
};

export function ListFilterSheet({
  tagOptions,
  draftStar,
  draftMinPrice,
  draftMaxPrice,
  draftTags,
  draftFacilities,
  onClose,
  onSetDraftStar,
  onSetDraftMinPrice,
  onSetDraftMaxPrice,
  onToggleDraftTag,
  onToggleDraftFacility,
  onApply,
}: Props) {
  return (
    <View style={styles.dropdownScrollContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.modalScrollContent}
      >
        <Text style={styles.modalTitle}>筛选条件</Text>

        <Text style={styles.modalLabel}>星级</Text>
        <View style={styles.tagsWrap}>
          {[1, 2, 3, 4, 5].map((value) => (
            <FilterChip
              key={value}
              label={`${value}星`}
              selected={draftStar === value}
              onPress={() => {
                onSetDraftStar(draftStar === value ? undefined : value);
              }}
              variant="rect"
            />
          ))}
        </View>

        <Text style={styles.modalLabel}>价格区间</Text>
        <View style={styles.priceRow}>
          <TextInput
            value={draftMinPrice}
            onChangeText={onSetDraftMinPrice}
            keyboardType="number-pad"
            placeholder="最低价"
            placeholderTextColor="#a2b2c8"
            style={[styles.input, styles.priceInput]}
          />
          <Text style={styles.separator}>-</Text>
          <TextInput
            value={draftMaxPrice}
            onChangeText={onSetDraftMaxPrice}
            keyboardType="number-pad"
            placeholder="最高价"
            placeholderTextColor="#a2b2c8"
            style={[styles.input, styles.priceInput]}
          />
        </View>

        <Text style={styles.modalLabel}>标签</Text>
        <View style={styles.tagsWrap}>
          {tagOptions.map((item) => (
            <FilterChip
              key={item.id}
              label={item.name}
              selected={draftTags.includes(item.name)}
              onPress={() => onToggleDraftTag(item.name)}
              variant="rect"
            />
          ))}
        </View>

        <Text style={styles.modalLabel}>设施服务</Text>
        <View style={styles.tagsWrap}>
          {FACILITY_OPTIONS.map((item) => (
            <FilterChip
              key={item.key}
              label={item.label}
              selected={draftFacilities.includes(item.key)}
              onPress={() => onToggleDraftFacility(item.key)}
              variant="rect"
            />
          ))}
        </View>

        <View style={styles.modalActions}>
          <Pressable onPress={onClose} style={[styles.modalButton, styles.cancelButton]}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable onPress={onApply} style={[styles.modalButton, styles.confirmButton]}>
            <Text style={styles.confirmText}>应用筛选</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
