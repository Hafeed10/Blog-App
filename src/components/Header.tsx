import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../types/auth';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onOpenDatabaseInfo?: () => void;
  showDatabaseStatus?: boolean;
  onPressBrand?: () => void;
  onOpenAdmin?: () => void;
  showAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDatabaseInfo,
  showDatabaseStatus = false,
  onPressBrand,
  onOpenAdmin,
  showAdmin = false,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { databaseStatus } = useBlog();
  const { user, isLoggedIn, setAuthModalVisible, setProfileModalVisible } = useAuth();

  return (
    <View style={[styles.container, { borderBottomColor: colors.separator }]}>
      <TouchableOpacity
        style={styles.left}
        onPress={onPressBrand}
        activeOpacity={onPressBrand ? 0.75 : 1}
        disabled={!onPressBrand}
      >
        <BrandLogo size={32} />
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>CHRONICLE</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            NEXT-GEN EDITORIAL
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.right}>
        {/* Database Status Pill (hidden by default) */}
        {showDatabaseStatus && (
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
        )}

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

        {/* Admin Console Shortcut (hidden by default) */}
        {showAdmin && onOpenAdmin && (
          <TouchableOpacity
            onPress={onOpenAdmin}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark" size={17} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Profile Avatar / Sign In Button */}
        {isLoggedIn && user ? (
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Image
              source={{ uri: user.avatarUrl || DEFAULT_AVATAR }}
              style={[
                styles.avatar,
                { borderColor: user.isAdmin ? '#EF4444' : colors.primary },
              ]}
            />
            <View
              style={[
                styles.onlineBadge,
                user.isAdmin && { backgroundColor: '#EF4444' },
              ]}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setAuthModalVisible(true)}
            activeOpacity={0.8}
            style={[
              styles.signInButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="person" size={12} color="#FFF" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
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
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  avatarWrapper: {
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 5,
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
