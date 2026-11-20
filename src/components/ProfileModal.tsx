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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../types/auth';

export const ProfileModal: React.FC = () => {
  const { colors } = useTheme();
  const {
    user,
    profileModalVisible,
    setProfileModalVisible,
    updateProfile,
    logout,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhoneNumber(user.phoneNumber);
      setAvatarUrl(user.avatarUrl || DEFAULT_AVATAR);
      setRole(user.role || 'Staff Contributor');
    }
  }, [user]);

  if (!user) return null;

  const handleClose = () => {
    setIsEditing(false);
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
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your author profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
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
                  {user.phoneNumber || 'Not specified'}
                </Text>
              </View>

              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.infoLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Status</Text>
                </View>
                <Text style={[styles.infoValue, { color: '#10B981' }]}>
                  Verified Author
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

              {/* Log out button */}
              <TouchableOpacity
                onPress={handleLogout}
                style={[
                  styles.logoutBtn,
                  { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
                ]}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
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
});
