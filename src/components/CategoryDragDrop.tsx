import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
  Alert,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { DEFAULT_CATEGORIES } from '../types/blog';

interface CategoryDragDropProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  title?: string;
  showAllOption?: boolean;
}

const PRESET_SUGGESTIONS = [
  'Science',
  'Web3',
  'AI Tools',
  'Startups',
  'Productivity',
  'Mobile',
  'Security',
  'Gaming',
];

export const CategoryDragDrop: React.FC<CategoryDragDropProps> = ({
  selectedCategory,
  onSelectCategory,
  title = 'CATEGORY',
  showAllOption = false,
}) => {
  const { colors } = useTheme();
  const {
    categories,
    addCustomCategory,
    removeCustomCategory,
    reorderCategories,
    resetCategories,
  } = useBlog();

  // Local ordering state for smooth drag animations
  const [items, setItems] = useState<string[]>(categories);
  const [isReordering, setIsReordering] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);

  // Sync items when context categories change (unless actively reordering)
  useEffect(() => {
    if (!isReordering) {
      setItems(categories);
    }
  }, [categories, isReordering]);

  // Pan animation values for drag
  const panX = useRef(new Animated.Value(0)).current;
  const currentDragIdxRef = useRef<number | null>(null);
  currentDragIdxRef.current = activeDragIndex;

  const itemsRef = useRef<string[]>(items);
  itemsRef.current = items;

  // Move item in array helper
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= itemsRef.current.length) return;
    const next = [...itemsRef.current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    itemsRef.current = next;
    reorderCategories(next);
  };

  // Shift item left
  const handleShiftLeft = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  // Shift item right
  const handleShiftRight = (index: number) => {
    if (index < items.length - 1) {
      moveItem(index, index + 1);
    }
  };

  // Add custom category
  const handleAddCustom = async (nameToAdd?: string) => {
    const val = (nameToAdd || customInput).trim();
    if (!val) {
      Alert.alert('Category Name Required', 'Please enter a name for the custom category.');
      return;
    }
    const added = await addCustomCategory(val);
    if (added) {
      onSelectCategory(added);
      setCustomInput('');
      setShowAddCustom(false);
    }
  };

  // Delete custom category
  const handleDeleteCustom = (cat: string) => {
    Alert.alert(
      'Remove Category',
      `Are you sure you want to remove "${cat}" from your categories list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCustomCategory(cat);
            if (selectedCategory === cat) {
              onSelectCategory(items.find((c) => c !== cat) || 'AI & Tech');
            }
          },
        },
      ]
    );
  };

  // Reset to default
  const handleReset = () => {
    Alert.alert(
      'Reset Categories',
      'Restore the default category list and order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            resetCategories();
            setItems([...DEFAULT_CATEGORIES]);
          },
        },
      ]
    );
  };

  // PanResponder creator for a specific pill index
  const createPanResponder = (index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isReordering,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isReordering && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setActiveDragIndex(index);
        panX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx);

        // Calculate if we've crossed threshold to swap with neighboring item
        const threshold = 70; // average pill width offset
        const currentIdx = currentDragIdxRef.current;
        if (currentIdx === null) return;

        if (gestureState.dx > threshold && currentIdx < itemsRef.current.length - 1) {
          moveItem(currentIdx, currentIdx + 1);
          currentDragIdxRef.current = currentIdx + 1;
          setActiveDragIndex(currentIdx + 1);
          panX.setValue(0);
        } else if (gestureState.dx < -threshold && currentIdx > 0) {
          moveItem(currentIdx, currentIdx - 1);
          currentDragIdxRef.current = currentIdx - 1;
          setActiveDragIndex(currentIdx - 1);
          panX.setValue(0);
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          bounciness: 4,
        }).start(() => {
          setActiveDragIndex(null);
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
          setActiveDragIndex(null);
        });
      },
    });
  };

  const isDefaultCategory = (cat: string) => {
    return (DEFAULT_CATEGORIES as readonly string[]).includes(cat);
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Mode Actions */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
              {items.length}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          {/* Reorder / Drag and Drop Mode Toggle */}
          <TouchableOpacity
            onPress={() => {
              if (isReordering) {
                // Done reordering, save final
                reorderCategories(items);
              }
              setIsReordering(!isReordering);
            }}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isReordering ? colors.primary : colors.surface,
                borderColor: isReordering ? 'transparent' : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={isReordering ? 'checkmark-circle' : 'swap-horizontal'}
              size={14}
              color={isReordering ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isReordering ? '#FFFFFF' : colors.text },
              ]}
            >
              {isReordering ? 'Done' : 'Drag & Reorder'}
            </Text>
          </TouchableOpacity>

          {/* Add Custom Category Button */}
          <TouchableOpacity
            onPress={() => setShowAddCustom(!showAddCustom)}
            style={[
              styles.actionBtn,
              {
                backgroundColor: showAddCustom ? colors.primary : colors.surface,
                borderColor: showAddCustom ? 'transparent' : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={showAddCustom ? 'close' : 'add'}
              size={15}
              color={showAddCustom ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: showAddCustom ? '#FFFFFF' : colors.text },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reorder Mode Guidance Banner */}
      {isReordering && (
        <View style={[styles.reorderNoticeBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.reorderNoticeText, { color: colors.textSecondary }]}>
            Drag handles or tap ‹ › arrows to rearrange. Dragged order saves automatically.
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Custom Category Box */}
      {showAddCustom && (
        <View style={[styles.customCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.customCardHeader}>
            <View style={styles.customCardTitleRow}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.customCardTitle, { color: colors.text }]}>
                Add Custom Category
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddCustom(false)}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.customInputRow}>
            <TextInput
              placeholder="e.g. Science, Crypto, Life, Gaming..."
              placeholderTextColor={colors.textMuted}
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={() => handleAddCustom()}
              style={[
                styles.customTextInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                },
              ]}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => handleAddCustom()}
              style={[styles.addCustomSubmitBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.addCustomSubmitText}>Add & Select</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Preset Suggestion Chips */}
          <Text style={[styles.quickPresetTitle, { color: colors.textMuted }]}>
            QUICK SUGGESTIONS:
          </Text>
          <View style={styles.presetChipsWrap}>
            {PRESET_SUGGESTIONS.map((preset) => {
              const alreadyHas = items.some(
                (i) => i.toLowerCase() === preset.toLowerCase()
              );
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => handleAddCustom(preset)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: alreadyHas ? colors.card : colors.background,
                      borderColor: colors.cardBorder,
                      opacity: alreadyHas ? 0.5 : 1,
                    },
                  ]}
                  disabled={alreadyHas}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: alreadyHas ? colors.textMuted : colors.text },
                    ]}
                  >
                    + {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Horizontal Draggable & Selectable Category Pills List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Optional 'All' Filter Pill (for HomeScreen) */}
        {showAllOption && (
          <TouchableOpacity
            onPress={() => onSelectCategory('All')}
            activeOpacity={0.8}
            style={[
              styles.pill,
              {
                backgroundColor: selectedCategory === 'All' ? colors.primary : colors.card,
                borderColor: selectedCategory === 'All' ? 'transparent' : colors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: selectedCategory === 'All' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: selectedCategory === 'All' ? '700' : '500',
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        )}

        {/* Dynamic Reorderable Categories */}
        {items.map((cat, index) => {
          const isSelected = selectedCategory === cat;
          const isDragging = activeDragIndex === index;
          const panResponder = createPanResponder(index);
          const isCustom = !isDefaultCategory(cat);

          const animatedStyle: StyleProp<ViewStyle> = isDragging
            ? {
                transform: [{ translateX: panX }, { scale: 1.08 }],
                zIndex: 999,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
              }
            : undefined;

          return (
            <Animated.View
              key={`${cat}-${index}`}
              style={[styles.pillWrapper, animatedStyle]}
              {...panResponder.panHandlers}
            >
              {isReordering ? (
                // Reorder Mode Pill with Drag Handle & Shift Controls
                <View
                  style={[
                    styles.reorderPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? 'transparent' : colors.cardBorder,
                    },
                  ]}
                >
                  {/* Left Shift Arrow */}
                  <TouchableOpacity
                    onPress={() => handleShiftLeft(index)}
                    disabled={index === 0}
                    style={[styles.shiftArrow, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Drag Handle Icon & Name */}
                  <TouchableOpacity
                    onPress={() => onSelectCategory(cat)}
                    activeOpacity={0.8}
                    style={styles.reorderContent}
                  >
                    <Ionicons
                      name="reorder-two"
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>

                  {/* Right Shift Arrow */}
                  <TouchableOpacity
                    onPress={() => handleShiftRight(index)}
                    disabled={index === items.length - 1}
                    style={[
                      styles.shiftArrow,
                      { opacity: index === items.length - 1 ? 0.3 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {/* Delete Button for Custom Categories */}
                  {isCustom && (
                    <TouchableOpacity
                      onPress={() => handleDeleteCustom(cat)}
                      style={styles.deleteCustomBtn}
                    >
                      <Ionicons name="close-circle" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                // Standard Interactive Pill
                <TouchableOpacity
                  onPress={() => onSelectCategory(cat)}
                  onLongPress={() => {
                    setIsReordering(true);
                  }}
                  delayLongPress={350}
                  activeOpacity={0.8}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? 'transparent' : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
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
                          backgroundColor: isSelected ? '#FFFFFF' : colors.primary,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              )}
            </Animated.View>
          );
        })}

        {/* Quick Add Custom Chip Button at end of list */}
        {!isReordering && (
          <TouchableOpacity
            onPress={() => setShowAddCustom(true)}
            activeOpacity={0.7}
            style={[
              styles.addChipBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={[styles.addChipText, { color: colors.primary }]}>Custom</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reorderNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  reorderNoticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  customCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  customCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  customTextInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  addCustomSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addCustomSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickPresetTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    marginVertical: 4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  pillWrapper: {
    position: 'relative',
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
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  reorderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  shiftArrow: {
    padding: 2,
  },
  deleteCustomBtn: {
    marginLeft: 2,
    padding: 2,
  },
  addChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
