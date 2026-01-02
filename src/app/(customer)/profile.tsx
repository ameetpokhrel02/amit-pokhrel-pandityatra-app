import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, setMode, colors } = useTheme();
  const { t, i18n } = useTranslation();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'np' : 'en';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
      </View>

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

      <View style={styles.logoutContainer}>
        <Button 
          title={t('profile.logout')} 
          onPress={() => router.replace('/auth/welcome')} 
          variant="outline"
          style={{ borderColor: colors.deepRed }}
          textStyle={{ color: colors.deepRed }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
    marginTop: 'auto',
    marginBottom: 20,
  },
});
