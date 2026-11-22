import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { DEFAULT_AVATAR } from '../types/auth';
import { BrandLogo } from '../components/BrandLogo';

interface SettingsScreenProps {
  onNavigateToTab?: (tab: 'landing' | 'home' | 'bookmarks' | 'db' | 'admin' | 'settings') => void;
  onOpenDatabaseInfo?: () => void;
  onOpenAdmin?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToTab,
  onOpenDatabaseInfo,
  onOpenAdmin,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    bookmarkedPosts,
    posts,
    clearAllCache,
    restoreDefaultPosts,
  } = useBlog();
  const {
    user,
    isLoggedIn,
    setAuthModalVisible,
    setProfileModalVisible,
    logout,
  } = useAuth();
  const { historyEvents, clearHistory } = useHistory();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out of your author profile?');
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of your author profile?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: () => logout() },
        ]
      );
    }
  };

  const handleClearHistory = () => {
    const action = async () => {
      await clearHistory();
      if (Platform.OS === 'web') {
        window.alert('Activity history has been cleared.');
      } else {
        Alert.alert('History Cleared', 'Activity history has been successfully cleared.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Clear all logged activity events from this device?')) {
        action();
      }
    } else {
      Alert.alert(
        'Clear Activity History',
        'Clear all logged activity events from this device?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: action },
        ]
      );
    }
  };

  const handleClearCache = async () => {
    const action = async () => {
      setIsProcessing(true);
      try {
        await clearAllCache();
        if (Platform.OS === 'web') {
          window.alert('Cache cleared successfully.');
        } else {
          Alert.alert('Cache Cleared', 'Local cache and stored articles have been reset.');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset local cache and reload fresh data?')) {
        action();
      }
    } else {
      Alert.alert(
        'Clear App Cache',
        'Reset local cache and reload fresh data?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Cache', style: 'destructive', onPress: action },
        ]
      );
    }
  };

  const handleRestoreDemoData = async () => {
    const action = async () => {
      setIsProcessing(true);
      try {
        await restoreDefaultPosts();
        if (Platform.OS === 'web') {
          window.alert('Demo dispatches successfully restored.');
        } else {
          Alert.alert('Restored', 'Default demo dispatches have been restored.');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Restore initial demo editorial dispatches?')) {
        action();
      }
    } else {
      Alert.alert(
        'Restore Demo Articles',
        'Restore initial demo editorial dispatches?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'default', onPress: action },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={28} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Preferences & configuration
            </Text>
          </View>
        </View>
        {onNavigateToTab && (
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            onPress={() => onNavigateToTab('home')}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Account / Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {isLoggedIn && user ? (
            <View>
              <View style={styles.profileRow}>
                <Image
                  source={{ uri: user.avatarUrl || DEFAULT_AVATAR }}
                  style={[
                    styles.avatar,
                    { borderColor: user.isAdmin ? '#EF4444' : colors.primary },
                  ]}
                />
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                    {user.isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.userRole, { color: colors.textMuted }]}>
                    {user.role || (user.isAdmin ? 'System Administrator' : 'Staff Contributor')}
                  </Text>
                  {user.email ? (
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {user.email}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
                  onPress={() => setProfileModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                  <Text style={[styles.editProfileBtnText, { color: colors.text }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.logoutBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                  <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.guestContainer}>
              <View
                style={[
                  styles.guestAvatarPlaceholder,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="person-outline" size={26} color={colors.textMuted} />
              </View>
              <View style={styles.guestTextContainer}>
                <Text style={[styles.guestTitle, { color: colors.text }]}>Guest Reader</Text>
                <Text style={[styles.guestSubtitle, { color: colors.textMuted }]}>
                  Sign in or create an author profile to compose stories and sync bookmarks.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.signInBtn, { backgroundColor: colors.primary }]}
                onPress={() => setAuthModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                <Text style={styles.signInBtnText}>Sign In / Join</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={19}
                  color={isDark ? colors.primary : '#F59E0B'}
                />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  {isDark ? 'Obsidian night theme active' : 'Daylight paper theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section: Content & Reading */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CONTENT & STORAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Saved Stories */}
          <TouchableOpacity
            style={styles.clickableRow}
            onPress={() => onNavigateToTab?.('bookmarks')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="bookmark-outline" size={19} color="#8B5CF6" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Saved Stories</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  {bookmarkedPosts.length} {bookmarkedPosts.length === 1 ? 'dispatch' : 'dispatches'} saved offline
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                {bookmarkedPosts.length}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          {/* Activity History */}
          <TouchableOpacity
            style={styles.clickableRow}
            onPress={handleClearHistory}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="time-outline" size={19} color={colors.primary} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Activity Log</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  {historyEvents.length} recorded events
                </Text>
              </View>
            </View>
            <Text style={[styles.actionLinkText, { color: colors.textMuted }]}>Clear</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          {/* Clear Cache */}
          <TouchableOpacity
            style={styles.clickableRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Clear Cache</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Purge offline cache & temporary records
                </Text>
              </View>
            </View>
            <Text style={[styles.actionLinkText, { color: '#EF4444' }]}>Reset</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          {/* Restore Demo Articles */}
          <TouchableOpacity
            style={styles.clickableRow}
            onPress={handleRestoreDemoData}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="refresh-outline" size={19} color="#10B981" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Restore Demo Posts</Text>
                <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                  Reload default editorial sample articles ({posts.length} loaded)
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: About */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.aboutRow}>
            <BrandLogo size={36} />
            <View style={styles.aboutTextContainer}>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>CHRONICLE</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.textMuted }]}>
                Next-Gen Editorial & Mobile Publishing Engine
              </Text>
              <Text style={[styles.aboutVersion, { color: colors.primary }]}>
                Version 2.4.0 (Expo SDK 58)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for floating bottom bar
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  adminBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  guestTextContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aboutTextContainer: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aboutSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutVersion: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
