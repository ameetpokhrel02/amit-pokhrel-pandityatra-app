import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/auth.store';
import { fetchPanditReviews, Review } from '@/services/review.service';

export default function PanditReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const panditId = user?.pandit_profile?.id;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!panditId) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchPanditReviews(panditId);
      setReviews(data.reviews);
      setAverageRating(data.average_rating);
      setTotalReviews(data.total_reviews);
    } catch (error) {
      console.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [panditId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const positivePct = totalReviews > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;

  const renderItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userRow}>
          <View style={styles.avatarPlaceholder}><Text style={styles.initials}>{item.customer_name.charAt(0)}</Text></View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.customer_name}</Text>
            <Text style={styles.date}>{dayjs(item.created_at).format('MMM D, YYYY')}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#f97316" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.title}>Reviews</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.statLbl}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{totalReviews}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{positivePct}%</Text>
          <Text style={styles.statLbl}>Positive</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#f97316" />
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f97316']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No reviews received yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff'
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  statsBar: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    margin: 15, 
    borderRadius: 15, 
    padding: 15,
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#f97316' },
  statLbl: { fontSize: 12, color: '#999', marginTop: 2 },
  statDivider: { width: 1, height: '60%', backgroundColor: '#eee', alignSelf: 'center' },
  listContent: { padding: 15, paddingTop: 0 },
  reviewCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#3E2723', justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  initials: { color: '#fff', fontWeight: 'bold' },
  userInfo: { },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  date: { fontSize: 12, color: '#999' },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff7ed', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  ratingText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: '#f97316' },
  comment: { fontSize: 14, color: '#666', lineHeight: 22, fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },
});
