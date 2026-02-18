import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { useUser } from '@/store/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile } from '@/services/auth.service';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { user, updateUser, logout } = useUser();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        updateUser({
          name: data.full_name,
          email: data.email,
          phone: data.phone_number,
          role: data.role,
          photoUri: data.profile_image ? data.profile_image : null,
        } as any);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    loadProfile();
  }, []);

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/auth/welcome');
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
        <Text style={[styles.title, { color: colors.text }]}>Pandit Profile</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          {user?.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.profileImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
              <Text style={styles.placeholderText}>{user?.name?.[0]?.toUpperCase() || 'P'}</Text>
            </View>
          )}
        </View>

        <View style={styles.nameContainer}>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Pandit Ji'}</Text>
          <Text style={[styles.userEmail, { color: colors.text, opacity: 0.7 }]}>{user?.email || user?.phone}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>VERIFIED PANDIT</Text>
          </View>
        </View>
      </View>

      {/* Professional Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>4.8</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>124</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Pujas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>10y</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Exp</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={24} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* More Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        {renderSettingItem("newspaper-outline", "Professional Bio", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("document-lock-outline", "Certifications", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("notifications-outline", "Notification Settings", () => { })}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {renderSettingItem("help-circle-outline", "Help & Support", () => { })}
      </View>

      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={() => setShowLogoutModal(true)}
          variant="outline"
          style={{ borderColor: '#EF4444' }}
          textStyle={{ color: '#EF4444' }}
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
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  nameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
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
  logoutContainer: {
    marginTop: 10,
    marginBottom: 60,
  },
});
