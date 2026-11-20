import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';

interface DatabaseStatusBannerProps {
  onOpenDatabaseInfo: () => void;
}

export const DatabaseStatusBanner: React.FC<DatabaseStatusBannerProps> = ({
  onOpenDatabaseInfo,
}) => {
  const { colors } = useTheme();
  const { databaseStatus } = useBlog();

  const isLive = databaseStatus.tableExists;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onOpenDatabaseInfo}
      style={[
        styles.banner,
        {
          backgroundColor: isLive
            ? 'rgba(16, 185, 129, 0.1)'
            : 'rgba(59, 130, 246, 0.1)',
          borderColor: isLive
            ? 'rgba(16, 185, 129, 0.25)'
            : 'rgba(59, 130, 246, 0.25)',
        },
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isLive
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
            },
          ]}
        >
          <Ionicons
            name={isLive ? 'cloud-done' : 'server-outline'}
            size={16}
            color={isLive ? '#10B981' : '#3B82F6'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isLive ? '#10B981' : colors.text },
            ]}
          >
            {isLive ? 'Supabase Database Live' : 'Database Ready for Setup'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isLive
              ? 'Synced in real-time with your PostgreSQL cloud cluster'
              : 'Tap to view 1-click SQL migration for Supabase'}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={isLive ? '#10B981' : colors.textMuted}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
});
