import React from 'react';
import { Modal, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { FilterChip } from '../../../components/FilterChip';
import { AppCityItem } from '../../../types/api';
import { searchStyles as styles } from '../styles';

type Props = {
  visible: boolean;
  sheetStyle: StyleProp<ViewStyle>;
  city: string;
  cityOptions: AppCityItem[];
  onSelectCity: (city: string) => void;
  onClose: () => void;
};

export function CitySheet({ visible, sheetStyle, city, cityOptions, onSelectCity, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalMaskBottom}>
        <View style={sheetStyle}>
          <Text style={styles.modalTitle}>选择城市</Text>
          <View style={styles.bottomChipWrap}>
            {cityOptions.map((item) => (
              <FilterChip
                key={item.city}
                label={item.city}
                selected={city === item.city}
                onPress={() => onSelectCity(item.city)}
                variant="rect"
              />
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.singleButton}>
            <Text style={styles.singleButtonText}>关闭</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
