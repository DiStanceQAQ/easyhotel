import React from 'react';
import { Modal, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { searchStyles as styles } from '../styles';

type GuestType = 'room' | 'adult' | 'child';

type Props = {
  visible: boolean;
  sheetStyle: StyleProp<ViewStyle>;
  roomCount: number;
  adultCount: number;
  childCount: number;
  onClose: () => void;
  onUpdateGuest: (type: GuestType, delta: 1 | -1) => void;
  onApply: () => void;
};

function CounterRow({
  label,
  value,
  disabledMinus,
  onMinus,
  onPlus,
  hint,
}: {
  label: string;
  value: number;
  disabledMinus: boolean;
  onMinus: () => void;
  onPlus: () => void;
  hint?: string;
}) {
  return (
    <View style={styles.guestCounterRow}>
      <View>
        <Text style={styles.guestCounterLabel}>{label}</Text>
        {hint ? <Text style={styles.guestCounterHint}>{hint}</Text> : null}
      </View>
      <View style={styles.counterActions}>
        <Pressable
          onPress={onMinus}
          disabled={disabledMinus}
          style={[styles.counterButton, disabledMinus ? styles.counterButtonDisabled : null]}
        >
          <Text
            style={[
              styles.counterButtonText,
              disabledMinus ? styles.counterButtonTextDisabled : null,
            ]}
          >
            −
          </Text>
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.counterButton}>
          <Text style={styles.counterButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function GuestSheet({
  visible,
  sheetStyle,
  roomCount,
  adultCount,
  childCount,
  onClose,
  onUpdateGuest,
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
            <Text style={styles.sheetTitle}>选择客房和入住人数</Text>
            <View style={styles.sheetHeaderSpace} />
          </View>

          <View style={styles.guestTipRow}>
            <Text style={styles.guestTipIcon}>ⓘ</Text>
            <Text style={styles.guestTipText}>入住人数较多时，试试增加间数</Text>
          </View>

          <CounterRow
            label="间数"
            value={roomCount}
            disabledMinus={roomCount <= 1}
            onMinus={() => onUpdateGuest('room', -1)}
            onPlus={() => onUpdateGuest('room', 1)}
          />

          <CounterRow
            label="成人数"
            value={adultCount}
            disabledMinus={adultCount <= 1}
            onMinus={() => onUpdateGuest('adult', -1)}
            onPlus={() => onUpdateGuest('adult', 1)}
          />

          <CounterRow
            label="儿童数"
            hint="0-17岁"
            value={childCount}
            disabledMinus={childCount <= 0}
            onMinus={() => onUpdateGuest('child', -1)}
            onPlus={() => onUpdateGuest('child', 1)}
          />

          <Pressable onPress={onApply} style={styles.guestDoneButton}>
            <Text style={styles.guestDoneText}>完成</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
