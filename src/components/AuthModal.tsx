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
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../types/auth';

const COUNTRY_CODES = [
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+7', country: 'Russia / Kazakhstan', flag: '🇷🇺' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
];

export const AuthModal: React.FC = () => {
  const { colors } = useTheme();
  const {
    authModalVisible,
    setAuthModalVisible,
    login,
    authReasonMessage,
    clearPendingAction,
  } = useAuth();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchCountryQuery, setSearchCountryQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('Staff Contributor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === selectedCountryCode) || COUNTRY_CODES[0];

  const filteredCountryCodes = COUNTRY_CODES.filter((item) => {
    if (!searchCountryQuery.trim()) return true;
    const q = searchCountryQuery.toLowerCase().trim();
    return (
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });

  const handleClose = () => {
    clearPendingAction();
    setAuthModalVisible(false);
  };

  // Only allow numbers for the phone number ("all number add option")
  const handlePhoneNumberChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numbersOnly);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your full name or author name.');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Phone Number Required', 'Please enter your phone number (digits only).');
      return;
    }

    if (phoneNumber.trim().length < 7) {
      Alert.alert('Invalid Number', 'Phone number must contain at least 7 digits.');
      return;
    }

    const finalAvatar = avatarUrl.trim() || DEFAULT_AVATAR;

    setIsSubmitting(true);
    const success = await login({
      name: trimmedName,
      phoneNumber: `${selectedCountryCode} ${phoneNumber.trim()}`,
      countryCode: selectedCountryCode,
      avatarUrl: finalAvatar,
      role: role.trim() || 'Staff Contributor',
    });

    setIsSubmitting(false);

    if (success) {
      Alert.alert(
        'Welcome!',
        `Logged in successfully as ${trimmedName}. You can now create your story!`
      );
      // Clean form fields
      setName('');
      setPhoneNumber('');
      setAvatarUrl('');
    } else {
      Alert.alert('Error', 'Failed to log in. Please try again.');
    }
  };

  return (
    <Modal
      visible={authModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Author Sign In</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              CHRONICLE MEMBERSHIP
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Reason Alert Banner */}
          {authReasonMessage ? (
            <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                },
              ]}
            >
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.noticeText, { color: colors.text }]}>
                {authReasonMessage}
              </Text>
            </View>
          ) : null}

          {/* SECTION 1: PROFILE PICTURE ADD OPTION */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            1. PROFILE PICTURE
          </Text>

          {/* Large Avatar Preview with Live Update */}
          <View style={styles.avatarPreviewSection}>
            <View
              style={[
                styles.avatarGlowWrapper,
                { borderColor: avatarUrl.trim() ? colors.primary : colors.cardBorder },
              ]}
            >
              {avatarUrl.trim() ? (
                <Image
                  source={{ uri: avatarUrl.trim() }}
                  style={styles.avatarMainPreview}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
                  <Ionicons name="person-outline" size={36} color={colors.textMuted} />
                </View>
              )}
              {avatarUrl.trim() ? (
                <TouchableOpacity
                  onPress={() => setAvatarUrl('')}
                  style={[styles.actionBadge, { backgroundColor: '#EF4444' }]}
                  activeOpacity={0.8}
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={13} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <View style={[styles.actionBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add" size={14} color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.avatarInfoCol}>
              <Text style={[styles.avatarInfoTitle, { color: colors.text }]}>
                {avatarUrl.trim() ? 'Photo Added' : 'Add Profile Picture'}
              </Text>
              <Text style={[styles.avatarInfoSub, { color: colors.textMuted }]}>
                {avatarUrl.trim()
                  ? 'Paste another URL to replace, or tap X to clear'
                  : 'Paste an image URL below to set your author avatar (optional)'}
              </Text>
            </View>
          </View>

          {/* Add Photo URL Input - ONLY adding option, all extra option images removed */}
          <View style={styles.customUrlContainer}>
            <View
              style={[
                styles.inputWithIcon,
                {
                  backgroundColor: colors.card,
                  borderColor: avatarUrl.trim() ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={avatarUrl.trim() ? colors.primary : colors.textMuted}
              />
              <TextInput
                placeholder="Paste profile photo URL (https://...)"
                placeholderTextColor={colors.textMuted}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.inputField, { color: colors.text }]}
              />
              {avatarUrl.trim() ? (
                <TouchableOpacity onPress={() => setAvatarUrl('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* SECTION 2: NAME INPUT */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            2. FULL NAME *
          </Text>
          <View
            style={[
              styles.inputWithIcon,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput
              placeholder="e.g. Alex Rivera or Elena Vance"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={[styles.inputField, { color: colors.text }]}
            />
            {name ? (
              <TouchableOpacity onPress={() => setName('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* SECTION 3: PHONE NUMBER (DROPDOWN ONLY) */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            3. PHONE NUMBER (ALL NUMBERS) *
          </Text>

          {/* Integrated Phone Input with Country Code Dropdown Trigger */}
          <View
            style={[
              styles.phoneInputRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Country Code Dropdown Trigger */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                {
                  borderRightColor: colors.cardBorder,
                  backgroundColor: isDropdownOpen ? (colors.primary + '18') : 'transparent',
                },
              ]}
              onPress={() => setIsDropdownOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
              <Text style={[styles.dropdownCodeText, { color: colors.text }]}>
                {selectedCountryCode}
              </Text>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={isDropdownOpen ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Digits Input */}
            <TextInput
              placeholder="Enter mobile / phone digits"
              placeholderTextColor={colors.textMuted}
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={16}
              style={[styles.phoneInputField, { color: colors.text }]}
            />
            {phoneNumber ? (
              <TouchableOpacity onPress={() => setPhoneNumber('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Country Code Dropdown Menu */}
          {isDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View
                style={[
                  styles.dropdownSearchRow,
                  { borderBottomColor: colors.cardBorder, backgroundColor: colors.background },
                ]}
              >
                <Ionicons name="search-outline" size={14} color={colors.textMuted} />
                <TextInput
                  placeholder="Search country name or code..."
                  placeholderTextColor={colors.textMuted}
                  value={searchCountryQuery}
                  onChangeText={setSearchCountryQuery}
                  style={[styles.dropdownSearchInput, { color: colors.text }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchCountryQuery ? (
                  <TouchableOpacity onPress={() => setSearchCountryQuery('')}>
                    <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                nestedScrollEnabled
                style={styles.dropdownList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredCountryCodes.length === 0 ? (
                  <View style={styles.emptyDropdownResult}>
                    <Text style={[styles.emptyDropdownText, { color: colors.textMuted }]}>
                      No matching country code found
                    </Text>
                  </View>
                ) : (
                  filteredCountryCodes.map((item) => {
                    const isSelected = selectedCountryCode === item.code;
                    return (
                      <TouchableOpacity
                        key={`${item.code}-${item.country}`}
                        onPress={() => {
                          setSelectedCountryCode(item.code);
                          setIsDropdownOpen(false);
                          setSearchCountryQuery('');
                        }}
                        style={[
                          styles.dropdownItem,
                          {
                            backgroundColor: isSelected
                              ? (colors.primary + '18')
                              : 'transparent',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemFlag}>{item.flag}</Text>
                        <Text
                          style={[
                            styles.dropdownItemCountry,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.country}
                        </Text>
                        <Text
                          style={[
                            styles.dropdownItemCode,
                            {
                              color: isSelected ? colors.primary : colors.textSecondary,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {item.code}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={colors.primary}
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Digits only. Accepts any valid number format (e.g. 9876543210).
          </Text>

          {/* SECTION 4: AUTHOR ROLE / TITLE */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            4. AUTHOR TITLE / ROLE (OPTIONAL)
          </Text>
          <View
            style={[
              styles.inputWithIcon,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="briefcase-outline" size={18} color={colors.textMuted} />
            <TextInput
              placeholder="e.g. Contributing Writer, Tech Columnist"
              placeholderTextColor={colors.textMuted}
              value={role}
              onChangeText={setRole}
              style={[styles.inputField, { color: colors.text }]}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  {authReasonMessage ? 'Sign In & Compose Story' : 'Complete Sign In'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 50,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  avatarPreviewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    marginTop: 4,
  },
  avatarGlowWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    padding: 3,
    position: 'relative',
  },
  avatarMainPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarInfoCol: {
    flex: 1,
  },
  avatarInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  avatarInfoSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  customUrlContainer: {
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 4,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingRight: 12,
    marginBottom: 4,
    overflow: 'hidden',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    gap: 6,
  },
  selectedFlag: {
    fontSize: 16,
  },
  dropdownCodeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingLeft: 12,
    letterSpacing: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 220,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 2,
  },
  dropdownList: {
    maxHeight: 165,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  dropdownItemFlag: {
    fontSize: 16,
    marginRight: 10,
  },
  dropdownItemCountry: {
    flex: 1,
    fontSize: 13,
  },
  dropdownItemCode: {
    fontSize: 13,
    marginLeft: 8,
  },
  emptyDropdownResult: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 12,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 6,
    marginLeft: 4,
  },
  submitButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
