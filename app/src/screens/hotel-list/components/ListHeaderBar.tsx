import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { FilterChip } from '../../../components/FilterChip';
import { AppTagItem } from '../../../types/api';
import { hotelListStyles as styles } from '../styles';
import { formatShortDate } from '../utils';

type Props = {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  keywordInput: string;
  roomCount: number;
  adultCount: number;
  childCount: number;
  sortLabel: string;
  tagOptions: AppTagItem[];
  selectedTags: string[];
  isSearchPanelOpen: boolean;
  isKeywordFocused: boolean;
  isSortPanelOpen: boolean;
  isFilterPanelOpen: boolean;
  onBack: () => void;
  onToggleSearchPanel: () => void;
  onToggleSortPanel: () => void;
  onToggleFilterPanel: () => void;
  onChangeKeyword: (value: string) => void;
  onFocusKeyword: () => void;
  onSubmitKeyword: () => void;
  onBlurKeyword: () => void;
  onClearKeyword: () => void;
  onToggleQuickTag: (name: string) => void;
  onTopSearchBarLayout: (height: number) => void;
  onSortBarLayout: (height: number) => void;
};

export function ListHeaderBar({
  city,
  checkIn,
  checkOut,
  keywordInput,
  roomCount,
  adultCount,
  childCount,
  sortLabel,
  tagOptions,
  selectedTags,
  isSearchPanelOpen,
  isKeywordFocused,
  isSortPanelOpen,
  isFilterPanelOpen,
  onBack,
  onToggleSearchPanel,
  onToggleSortPanel,
  onToggleFilterPanel,
  onChangeKeyword,
  onFocusKeyword,
  onSubmitKeyword,
  onBlurKeyword,
  onClearKeyword,
  onToggleQuickTag,
  onTopSearchBarLayout,
  onSortBarLayout,
}: Props) {
  const roomGuestText =
    childCount > 0
      ? `${roomCount}间 ${adultCount}人 ${childCount}儿童`
      : `${roomCount}间 ${adultCount}人`;

  return (
    <>
      <View
        style={styles.topSearchBar}
        onLayout={(event) => onTopSearchBarLayout(event.nativeEvent.layout.height)}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>

        <Pressable
          onPress={onToggleSearchPanel}
          style={[styles.leftSearchCard, isSearchPanelOpen ? styles.searchCardActive : null]}
        >
          <Text style={styles.cityText}>{city ?? '上海'}</Text>
          <View>
            <Text style={styles.dateText}>{formatShortDate(checkIn)}</Text>
            <Text style={styles.dateText}>{formatShortDate(checkOut)}</Text>
          </View>
          <View>
            <Text style={styles.dateText}>{roomGuestText}</Text>
          </View>
        </Pressable>

        <View style={[styles.rightSearchCard, isKeywordFocused ? styles.searchCardActive : null]}>
          <TextInput
            value={keywordInput}
            onChangeText={onChangeKeyword}
            onFocus={onFocusKeyword}
            onBlur={onBlurKeyword}
            onSubmitEditing={onSubmitKeyword}
            placeholder="位置/品牌/酒店"
            placeholderTextColor="#9bacbf"
            style={styles.rightSearchInput}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {keywordInput ? (
            <Pressable onPress={onClearKeyword} style={styles.keywordClearButton}>
              <Text style={styles.keywordClearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={styles.sortBar}
        onLayout={(event) => onSortBarLayout(event.nativeEvent.layout.height)}
      >
        <Pressable style={styles.sortItem} onPress={onToggleSortPanel}>
          <Text style={[styles.sortText, isSortPanelOpen ? styles.sortTextActive : null]}>
            {`${sortLabel}${isSortPanelOpen ? '▴' : '▾'}`}
          </Text>
        </Pressable>
        <Pressable style={styles.sortItem} onPress={onToggleFilterPanel}>
          <Text style={[styles.sortText, isFilterPanelOpen ? styles.sortTextActive : null]}>
            {`筛选${isFilterPanelOpen ? '▴' : '▾'}`}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickTagScroll}
        contentContainerStyle={styles.quickTagRow}
      >
        {tagOptions.map((item) => (
          <FilterChip
            key={item.id}
            label={item.name}
            selected={selectedTags.includes(item.name)}
            onPress={() => onToggleQuickTag(item.name)}
            variant="rect"
          />
        ))}
      </ScrollView>
    </>
  );
}
