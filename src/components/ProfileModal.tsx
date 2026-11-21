import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../types/auth';

interface ProfileModalProps {
  onOpenAdmin?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onOpenAdmin }) => {
  const { colors } = useTheme();
  const {
    user,
    profileModalVisible,
    setProfileModalVisible,
    updateProfile,
    logout,
    openAdminLogin,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || DEFAULT_AVATAR);
      setRole(user.role || 'Staff Contributor');
    }
  }, [user]);

  if (!user) return null;

  const handleClose = () => {
    setIsEditing(false);
    setShowLogoutConfirm(false);
    setProfileModalVisible(false);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

    const finalAvatar = avatarUrl.trim() || DEFAULT_AVATAR;

    const success = await updateProfile({
      name: trimmedName,
      phoneNumber: phoneNumber.trim(),
      avatarUrl: finalAvatar,
      role: role.trim() || 'Staff Contributor',
    });

    if (success) {
      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your author details have been successfully saved.');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <Modal
      visible={profileModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Profile' : 'Author Profile'}
          </Text>
          <TouchableOpacity
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
            style={[styles.headerActionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.headerActionBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Avatar & Hero */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarBorder, { borderColor: colors.primary }]}>
              <Image
                source={{
                  uri: avatarUrl || user.avatarUrl || DEFAULT_AVATAR,
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.userRole, { color: colors.textMuted }]}>{user.role || 'Author'}</Text>
          </View>

          {isEditing ? (
            /* EDIT FORM */
            <View style={styles.editForm}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                CHANGE PROFILE PICTURE
              </Text>

              {/* Add Photo URL Input - ONLY adding option */}
              <View
                style={[
                  styles.inputWithIcon,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons name="image-outline" size={18} color={avatarUrl ? colors.primary : colors.textMuted} />
                <TextInput
                  placeholder="Paste profile photo URL (https://...)"
                  placeholderTextColor={colors.textMuted}
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.inputFieldInner, { color: colors.text }]}
                />
                {avatarUrl ? (
                  <TouchableOpacity onPress={() => setAvatarUrl('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Name */}
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                FULL NAME
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />

              {/* Phone Number */}
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                PHONE NUMBER (ALL NUMBERS)
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9+\s-]/g, ''))}
                keyboardType="phone-pad"
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />

              {/* Role */}
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                AUTHOR ROLE
              </Text>
              <TextInput
                value={role}
                onChangeText={setRole}
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  },
                ]}
              />
            </View>
          ) : (
            /* VIEW DETAILS CARD */
            <View style={styles.detailsList}>
              {user.email ? (
                <View
                  style={[
                    styles.infoRow,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.infoLeft}>
                    <Ionicons name="mail-outline" size={20} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
                </View>
              ) : null}

              {user.phoneNumber ? (
                <View
                  style={[
                    styles.infoRow,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <View style={styles.infoLeft}>
                    <Ionicons name="call-outline" size={20} color={colors.primary} />
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
                  </View>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user.phoneNumber}
                  </Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.infoLeft}>
                  <Ionicons
                    name={user.isAdmin ? 'shield-checkmark' : 'shield-checkmark-outline'}
                    size={20}
                    color={user.isAdmin ? '#EF4444' : colors.primary}
                  />
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Status</Text>
                </View>
                <Text
                  style={[
                    styles.infoValue,
                    { color: user.isAdmin ? '#EF4444' : '#10B981', fontWeight: '700' },
                  ]}
                >
                  {user.isAdmin ? 'System Administrator' : 'Verified Author'}
                </Text>
              </View>

              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Member Since</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {/* Admin Console Shortcut Button */}
              {onOpenAdmin && (
                <TouchableOpacity
                  onPress={() => {
                    handleClose();
                    onOpenAdmin();
                  }}
                  style={[
                    styles.adminConsoleBtn,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
                  <Text style={styles.adminConsoleBtnText}>
                    {user.isAdmin ? 'Open Admin Console' : 'Admin Console & Full Control'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Switch to Admin (Email & Password) if not already admin */}
              {!user.isAdmin && (
                <TouchableOpacity
                  onPress={() => {
                    handleClose();
                    openAdminLogin();
                  }}
                  style={[
                    styles.adminConsoleBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                      marginTop: 8,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="key-outline" size={18} color={colors.primary} />
                  <Text style={[styles.adminConsoleBtnText, { color: colors.text }]}>
                    Sign in as Admin (Email & Password)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Log out section with cross-platform confirmation */}
              {showLogoutConfirm ? (
                <View
                  style={[
                    styles.logoutConfirmBox,
                    {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                    },
                  ]}
                >
                  <View style={styles.logoutConfirmHeader}>
                    <Ionicons name="warning" size={20} color="#EF4444" />
                    <Text style={[styles.logoutConfirmTitle, { color: colors.text }]}>
                      Confirm Log Out
                    </Text>
                  </View>
                  <Text style={[styles.logoutConfirmSub, { color: colors.textMuted }]}>
                    Are you sure you want to log out of your author profile? You will need to sign in again to compose stories.
                  </Text>
                  <View style={styles.logoutConfirmActions}>
                    <TouchableOpacity
                      onPress={() => setShowLogoutConfirm(false)}
                      style={[
                        styles.logoutCancelBtn,
                        { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.logoutCancelBtnText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleConfirmLogout}
                      disabled={isLoggingOut}
                      style={[styles.logoutConfirmBtn, { backgroundColor: '#EF4444' }]}
                      activeOpacity={0.8}
                    >
                      {isLoggingOut ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="log-out" size={16} color="#FFF" />
                          <Text style={styles.logoutConfirmBtnText}>Yes, Log Out</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleLogout}
                  style={[
                    styles.logoutBtn,
                    { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                  <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  headerActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    padding: 3,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsList: {
    gap: 10,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 18,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutConfirmBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 18,
  },
  logoutConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  logoutConfirmTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  logoutConfirmSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  logoutConfirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  logoutCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutConfirmBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  logoutConfirmBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editForm: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 10,
  },
  inputFieldInner: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  adminConsoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  adminConsoleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
