import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { DEFAULT_CATEGORIES } from '../types/blog';

export const CategoryFilter: React.FC = () => {
  const { colors } = useTheme();
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    addCustomCategory,
    removeCustomCategory,
    reorderCategories,
  } = useBlog();

  const [isReordering, setIsReordering] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const filterList = ['All', ...categories];

  const handleShiftLeft = (cat: string) => {
    const idx = categories.indexOf(cat);
    if (idx > 0) {
      const next = [...categories];
      const [moved] = next.splice(idx, 1);
      next.splice(idx - 1, 0, moved);
      reorderCategories(next);
    }
  };

  const handleShiftRight = (cat: string) => {
    const idx = categories.indexOf(cat);
    if (idx >= 0 && idx < categories.length - 1) {
      const next = [...categories];
      const [moved] = next.splice(idx, 1);
      next.splice(idx + 1, 0, moved);
      reorderCategories(next);
    }
  };

  const handleAddCustom = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a custom category name.');
      return;
    }
    const added = await addCustomCategory(trimmed);
    if (added) {
      setSelectedCategory(added);
      setCustomInput('');
      setShowAddCustom(false);
    }
  };

  const handleDeleteCustom = (cat: string) => {
    Alert.alert(
      'Remove Category',
      `Remove "${cat}" from categories?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCustomCategory(cat);
            if (selectedCategory === cat) setSelectedCategory('All');
          },
        },
      ]
    );
  };

  const isDefaultCategory = (cat: string) => {
    return cat === 'All' || (DEFAULT_CATEGORIES as readonly string[]).includes(cat);
  };

  return (
    <View style={styles.container}>
      {/* Reorder Mode Guidance Banner if active */}
      {isReordering && (
        <View
          style={[
            styles.reorderBanner,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
          <Text style={[styles.reorderBannerText, { color: colors.textSecondary }]}>
            Use ‹ › arrows to reorder category pills. Changes persist.
          </Text>
          <TouchableOpacity
            onPress={() => setIsReordering(false)}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inline Custom Category Creator */}
      {showAddCustom && (
        <View
          style={[
            styles.addCustomBox,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <TextInput
            placeholder="New category name (e.g. Science, Crypto)..."
            placeholderTextColor={colors.textMuted}
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={handleAddCustom}
            style={[
              styles.addCustomInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                color: colors.text,
              },
            ]}
            autoFocus
          />
          <TouchableOpacity
            onPress={handleAddCustom}
            style={[styles.addCustomBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="checkmark" size={14} color="#FFF" />
            <Text style={styles.addCustomBtnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddCustom(false)}
            style={styles.cancelCustomBtn}
          >
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Categories Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterList.map((cat) => {
          const isActive = selectedCategory === cat;
          const isCustom = !isDefaultCategory(cat);
          const catIndexInCategories = categories.indexOf(cat);

          if (isReordering && cat !== 'All') {
            return (
              <View
                key={cat}
                style={[
                  styles.reorderPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? 'transparent' : colors.cardBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleShiftLeft(cat)}
                  disabled={catIndexInCategories <= 0}
                  style={[
                    styles.arrowBtn,
                    { opacity: catIndexInCategories <= 0 ? 0.3 : 1 },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={13}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedCategory(cat)}
                  style={styles.reorderTitleWrap}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleShiftRight(cat)}
                  disabled={catIndexInCategories >= categories.length - 1}
                  style={[
                    styles.arrowBtn,
                    {
                      opacity:
                        catIndexInCategories >= categories.length - 1 ? 0.3 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                  />
                </TouchableOpacity>

                {isCustom && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCustom(cat)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              onLongPress={() => {
                if (cat !== 'All') setIsReordering(true);
              }}
              delayLongPress={400}
              activeOpacity={0.75}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? 'transparent' : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {cat}
              </Text>
              {isCustom && (
                <View
                  style={[
                    styles.customDot,
                    {
                      backgroundColor: isActive ? '#FFFFFF' : colors.primary,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Action Pills at end of list: + Custom and Reorder */}
        {!isReordering && (
          <View style={styles.actionPillsGroup}>
            <TouchableOpacity
              onPress={() => setShowAddCustom(!showAddCustom)}
              activeOpacity={0.7}
              style={[
                styles.iconActionPill,
                {
                  backgroundColor: showAddCustom ? colors.primary : colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="add"
                size={14}
                color={showAddCustom ? '#FFFFFF' : colors.primary}
              />
              <Text
                style={[
                  styles.iconActionText,
                  { color: showAddCustom ? '#FFFFFF' : colors.primary },
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsReordering(true)}
              activeOpacity={0.7}
              style={[
                styles.iconActionPill,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={13}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 5,
  },
  pillText: {
    fontSize: 13,
  },
  customDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  reorderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  reorderTitleWrap: {
    paddingHorizontal: 4,
  },
  arrowBtn: {
    padding: 3,
  },
  deleteBtn: {
    padding: 2,
    marginLeft: 2,
  },
  actionPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reorderBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBannerText: {
    fontSize: 11,
    flex: 1,
  },
  doneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addCustomBox: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addCustomInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addCustomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelCustomBtn: {
    padding: 4,
  },
});
