import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useUser } from '@/store/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, updateUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'np' : 'en';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/auth/welcome');
  };

  const handleImagePress = () => {
    Alert.alert(
      "Profile Photo",
      "Choose an option",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove Photo", style: "destructive", onPress: removePhoto },
        { text: "Choose from Library", onPress: pickImage },
      ]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateUser({ photoUri: result.assets[0].uri });
    }
  };

  const removePhoto = () => {
    updateUser({ photoUri: null });
  };

  const startEditingName = () => {
    setTempName(user?.name || '');
    setIsEditingName(true);
  };

  const saveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const renderSettingItem = (icon: any, label: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={24} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.text} style={{ opacity: 0.5 }} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleImagePress} style={styles.imageContainer}>
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
              <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          )}
          <View style={[styles.editIconBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.nameContainer}>
          {isEditingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderColor: colors.primary }]}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
              />
              <TouchableOpacity onPress={saveName} style={styles.iconButton}>
                <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditingName(false)} style={styles.iconButton}>
                <Ionicons name="close-circle" size={28} color={colors.deepRed} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
              <TouchableOpacity onPress={startEditingName} style={styles.editButton}>
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}>{user?.email || 'email@example.com'}</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.darkMode')}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="language" size={24} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.language')}</Text>
          </View>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
            <Text style={[styles.langText, { color: colors.primary }]}>
              {i18n.language === 'en' ? 'English' : 'नेपाली'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* More Settings */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        {renderSettingItem("notifications-outline", "Notifications", () => {})}
        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]} />
        {renderSettingItem("lock-closed-outline", "Privacy Policy", () => {})}
        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]} />
        {renderSettingItem("document-text-outline", "Terms of Service", () => {})}
        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]} />
        {renderSettingItem("help-circle-outline", "Help & Support", () => {})}
      </View>

      <View style={styles.logoutContainer}>
        <Button 
          title={t('profile.logout')} 
          onPress={() => setShowLogoutModal(true)} 
          variant="outline"
          style={{ borderColor: colors.deepRed }}
          textStyle={{ color: colors.deepRed }}
        />
      </View>

      <LogoutModal 
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  nameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    minWidth: 150,
    textAlign: 'center',
    paddingBottom: 4,
  },
  editButton: {
    padding: 4,
  },
  iconButton: {
    padding: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  langButton: {
    padding: 8,
  },
  langText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
});
