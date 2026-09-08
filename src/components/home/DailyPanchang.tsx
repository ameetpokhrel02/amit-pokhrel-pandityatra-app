import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';

export const DailyPanchang = React.memo(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPanchang(dayjs().format('YYYY-MM-DD'))
      .then((res) => mounted && setData(res))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const goToDetail = () => router.push('/(customer)/panchang' as any);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Today&apos;s Panchang</Text>
        <TouchableOpacity onPress={goToDetail} style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Full Details</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={goToDetail}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.dateBlock}>
              <Text style={[styles.nepaliDate, { color: colors.primary }]}>
                {data?.nepali_date || dayjs().format('D')}
              </Text>
              <Text style={[styles.englishDate, { color: colors.text + '70' }]}>
                {dayjs().format('dddd, MMM D')}
              </Text>
              <View style={[styles.tithiBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.tithiText, { color: colors.primary }]}>{data?.tithi || 'Tithi unavailable'}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.statsRow}>
              <PanchangStat icon="sunny" color="#F59E0B" label="Sunrise" value={data?.sunrise || '—'} colors={colors} />
              <PanchangStat icon="moon" color="#6366F1" label="Sunset" value={data?.sunset || '—'} colors={colors} />
              <PanchangStat icon="star" color="#10B981" label="Nakshatra" value={data?.nakshatra || '—'} colors={colors} />
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
});

const PanchangStat = ({ icon, color, label, value, colors }: any) => (
  <View style={styles.statItem}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.text + '60' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  loadingRow: {
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBlock: {
    alignItems: 'center',
  },
  nepaliDate: {
    fontSize: 30,
    fontWeight: '900',
  },
  englishDate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  tithiBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tithiText: {
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
