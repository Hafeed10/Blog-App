import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';

interface HeaderProps {
  onOpenDatabaseInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDatabaseInfo }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { databaseStatus } = useBlog();

  return (
    <View style={[styles.container, { borderBottomColor: colors.separator }]}>
      <View style={styles.left}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={16} color="#FFF" />
        </View>
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>CHRONICLE</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            NEXT-GEN EDITORIAL
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {/* Database Status Pill */}
        <TouchableOpacity
          onPress={onOpenDatabaseInfo}
          activeOpacity={0.7}
          style={[
            styles.dbBadge,
            {
              backgroundColor: databaseStatus.tableExists
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              borderColor: databaseStatus.tableExists
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <View
            style={[
              styles.dbDot,
              {
                backgroundColor: databaseStatus.tableExists ? '#10B981' : '#F59E0B',
              },
            ]}
          />
          <Text
            style={[
              styles.dbText,
              { color: databaseStatus.tableExists ? '#10B981' : '#F59E0B' },
            ]}
          >
            {databaseStatus.tableExists ? 'Supabase Live' : 'DB Setup'}
          </Text>
        </TouchableOpacity>

        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.iconButton,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>

        {/* Profile Avatar */}
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          }}
          style={[styles.avatar, { borderColor: colors.primary }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  dbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dbText: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
  },
});
