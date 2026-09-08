import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import { fetchPanchang } from '@/services/panchang.service';
import { PanchangData } from '@/services/api';
import {
    BsDate,
    NEPALI_MONTHS,
    NEPALI_WEEKDAYS,
    addBsMonths,
    bsToAdIsoString,
    buildBsMonthGrid,
    getTodayBs,
    toDevanagariDigits,
} from '@/utils/nepaliCalendar';

const { width } = Dimensions.get('window');
// 16px scroll padding + 12px calendar-card padding on each side
const CELL_SIZE = (width - 2 * (16 + 12)) / 7;

export default function PanchangScreen() {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const todayBs = useMemo(() => getTodayBs(), []);
    const [viewYear, setViewYear] = useState(todayBs.year);
    const [viewMonth, setViewMonth] = useState(todayBs.month);
    const [selected, setSelected] = useState<BsDate>(todayBs);

    const [data, setData] = useState<PanchangData | null>(null);
    const [loading, setLoading] = useState(true);

    const grid = useMemo(() => buildBsMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchPanchang(bsToAdIsoString(selected))
            .then((res) => mounted && setData(res))
            .catch(() => mounted && setData(null))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, [selected]);

    const goToMonth = (delta: number) => {
        const next = addBsMonths(viewYear, viewMonth, delta);
        setViewYear(next.year);
        setViewMonth(next.month);
    };

    const selectDay = (bs: BsDate, inCurrentMonth: boolean) => {
        setSelected(bs);
        if (!inCurrentMonth) {
            setViewYear(bs.year);
            setViewMonth(bs.month);
        }
    };

    const goToToday = () => {
        setViewYear(todayBs.year);
        setViewMonth(todayBs.month);
        setSelected(todayBs);
    };

    const isSelected = (bs: BsDate) =>
        bs.year === selected.year && bs.month === selected.month && bs.date === selected.date;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Panchang</Text>
                <TouchableOpacity onPress={goToToday} style={styles.todayIconBtn}>
                    <Ionicons name="today-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Month Calendar Grid */}
                <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => goToMonth(-1)} style={styles.navArrow}>
                            <Ionicons name="chevron-back" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.monthTitleWrap}>
                            <Text style={[styles.monthTitle, { color: colors.text }]}>
                                {NEPALI_MONTHS[viewMonth]} {toDevanagariDigits(viewYear)}
                            </Text>
                            <Text style={[styles.monthSubtitle, { color: colors.text + '60' }]}>
                                {dayjs(bsToAdIsoString({ year: viewYear, month: viewMonth, date: 1 })).format('MMM')}
                                {' / '}
                                {dayjs(addOneBsMonthAdLabel(viewYear, viewMonth)).format('MMM YYYY')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => goToMonth(1)} style={styles.navArrow}>
                            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekdayRow}>
                        {NEPALI_WEEKDAYS.map((w, i) => (
                            <Text
                                key={w}
                                style={[
                                    styles.weekdayLabel,
                                    { width: CELL_SIZE, color: i === 6 ? colors.primary : colors.text + '70' },
                                ]}
                            >
                                {w}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        {grid.map((cell) => {
                            const selectedCell = isSelected(cell.bs);
                            return (
                                <TouchableOpacity
                                    key={`${cell.bs.year}-${cell.bs.month}-${cell.bs.date}-${cell.inCurrentMonth}`}
                                    style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                                    onPress={() => selectDay(cell.bs, cell.inCurrentMonth)}
                                >
                                    <View style={[
                                        styles.cellInner,
                                        selectedCell && { backgroundColor: colors.primary },
                                        !selectedCell && cell.isToday && { borderWidth: 1.5, borderColor: colors.primary },
                                    ]}>
                                        <Text style={[
                                            styles.cellDate,
                                            { color: cell.inCurrentMonth ? colors.text : colors.text + '35' },
                                            selectedCell && { color: '#FFF' },
                                            !selectedCell && cell.isToday && { color: colors.primary },
                                        ]}>
                                            {toDevanagariDigits(cell.bs.date)}
                                        </Text>
                                        <Text style={[
                                            styles.cellAdDate,
                                            { color: cell.inCurrentMonth ? colors.text + '50' : colors.text + '25' },
                                            selectedCell && { color: '#FFFFFFB0' },
                                        ]}>
                                            {cell.adDay}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Selected Day Summary */}
                <View style={[styles.selectedBar, { backgroundColor: colors.primary + '12' }]}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.selectedBarText, { color: colors.primary }]}>
                        {NEPALI_MONTHS[selected.month]} {toDevanagariDigits(selected.date)}, {toDevanagariDigits(selected.year)}
                        {'  ·  '}
                        {dayjs(bsToAdIsoString(selected)).format('dddd, MMMM D, YYYY')}
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <StatItem icon="sunny" label="Sunrise" value={data?.sunrise || '—'} color="#F59E0B" isDark={isDark} />
                            <StatItem icon="moon" label="Sunset" value={data?.sunset || '—'} color="#6366F1" isDark={isDark} />
                        </View>

                        <View style={[styles.section, styles.detailsCard, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>Celestial Details</Text>
                            <DetailRow label="Tithi" value={data?.tithi || '—'} icon="moon" isDark={isDark} />
                            <DetailRow label="Nakshatra" value={data?.nakshatra || '—'} icon="star" isDark={isDark} />
                            <DetailRow label="Yoga" value={data?.yoga || '—'} icon="infinite" isDark={isDark} />
                            <DetailRow label="Karana" value={data?.karana || '—'} icon="analytics" isDark={isDark} />
                            <DetailRow label="Rashi" value={data?.rashi || '—'} icon="moon" isDark={isDark} />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Auspicious Times</Text>
                            <View style={[styles.auspiciousCard, { backgroundColor: isDark ? '#1F2937' : '#F0FDF4' }]}>
                                <Ionicons name="time" size={20} color="#10B981" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.auspiciousLabel, { color: isDark ? '#9CA3AF' : '#047857' }]}>Abhijit Muhurta</Text>
                                    <Text style={[styles.auspiciousValue, { color: isDark ? '#FFF' : '#065F46' }]}>
                                        {data?.auspicious_time || 'Check later for better timings'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.noteBox}>
                    <Text style={styles.noteText}>
                        * These timings are approximate for Kathmandu, Nepal. Contact your Pandit for location-specific accuracy.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/** Small helper so the month-nav subtitle can show the AD month range a BS month spans. */
function addOneBsMonthAdLabel(year: number, month: number): string {
    const next = addBsMonths(year, month, 1);
    return bsToAdIsoString({ year: next.year, month: next.month, date: 1 });
}

const StatItem = ({ icon, label, value, color, isDark }: any) => (
    <View style={[styles.statItem, { backgroundColor: isDark ? '#1F2937' : '#FFF', borderColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={26} color={color} />
        </View>
        <View style={{ alignItems: 'center' }}>
            <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label}</Text>
            <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#1F2937' }]}>{value}</Text>
        </View>
    </View>
);

const DetailRow = ({ label, value, icon, isDark }: any) => (
    <View style={[styles.detailRow, { borderBottomColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <View style={styles.detailLeft}>
            <View style={[styles.miniIcon, { backgroundColor: isDark ? '#374151' : '#F9FAFB' }]}>
                <Ionicons name={icon} size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </View>
            <Text style={[styles.detailLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#333' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    todayIconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16 },

    calendarCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingBottom: 12,
    },
    navArrow: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    monthTitleWrap: { alignItems: 'center' },
    monthTitle: { fontSize: 17, fontWeight: '800' },
    monthSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
    weekdayRow: { flexDirection: 'row' },
    weekdayLabel: { textAlign: 'center', fontSize: 11, fontWeight: '700', paddingBottom: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { justifyContent: 'center', alignItems: 'center', paddingVertical: 3 },
    cellInner: {
        width: '86%',
        height: '86%',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellDate: { fontSize: 15, fontWeight: '700' },
    cellAdDate: { fontSize: 9, fontWeight: '600', marginTop: 1 },

    selectedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 20,
    },
    selectedBarText: { fontSize: 12, fontWeight: '800', flexShrink: 1 },

    loadingRow: { height: 120, justifyContent: 'center', alignItems: 'center' },

    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statItem: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    iconBg: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    detailsCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    miniIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    auspiciousCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    auspiciousLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    auspiciousValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    noteBox: {
        marginTop: 4,
        padding: 16,
    },
    noteText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 18,
    },
});
