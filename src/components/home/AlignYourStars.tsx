import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { RotatingChakra } from './RotatingChakra';

interface AlignYourStarsProps {
  onPress: () => void;
}

export const AlignYourStars = ({ onPress }: AlignYourStarsProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF7ED', borderColor: colors.border }]}
      >
        <RotatingChakra size={110} style={styles.chakra} />

        <Text style={[styles.title, { color: colors.text }]}>
          Align your stars for{' '}
          <Text style={{ color: colors.primary }}>Success</Text>
        </Text>
        <Text style={[styles.body, { color: colors.text + '90' }]}>
          The position of nine planets in your birth chart shapes your career, marriage, and
          well-being. We read your Kundali to spot doshas early and guide the pujas that ease them.
        </Text>

        <View style={[styles.cta, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={15} color="#FFF" />
          <Text style={styles.ctaText}>Generate My Kundali</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, marginTop: 28 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  chakra: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 26 },
  body: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 10, maxWidth: 320 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
  },
  ctaText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
