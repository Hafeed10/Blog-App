import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { Category } from '../types/blog';

const CATEGORIES: Category[] = [
  'All',
  'AI & Tech',
  'Design',
  'Engineering',
  'Culture',
  'Business',
];

export const CategoryFilter: React.FC = () => {
  const { colors } = useTheme();
  const { selectedCategory, setSelectedCategory } = useBlog();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
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
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
  },
});
