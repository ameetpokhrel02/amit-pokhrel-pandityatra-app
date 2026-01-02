import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Colors } from '@/constants/Colors';
import { usePanditStore } from '@/store/pandit.store';
import { PanditCard } from '@/components/pandit/PanditCard';
import { PanditFilterSheet } from '@/components/pandit/PanditFilterSheet';
import { Pandit } from '@/types/pandit';

export default function PanditListingPage() {
  const router = useRouter();
  const { pandits, isLoading, error, fetchPandits, filter, setFilter } = usePanditStore();
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPandits();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPandits();
    setRefreshing(false);
  }, [fetchPandits]);

  const handleSearch = (text: string) => {
    setFilter({ searchQuery: text });
  };

  const renderItem = ({ item, index }: { item: Pandit; index: number }) => (
    <PanditCard
      pandit={item}
      index={index}
      onPress={() => router.push(`/(customer)/pandit/${item.id}`)}
      onBook={() => router.push(`/(customer)/booking?panditId=${item.id}`)}
    />
  );

  const renderEmptyState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.emptyState}
    >
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search" size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyTitle}>No Pandits Found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters or search terms.</Text>
      <TouchableOpacity style={styles.clearButton} onPress={() => setFilter({ searchQuery: '', location: undefined, minRating: undefined, availability: undefined })}>
        <Text style={styles.clearButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header with Search & Filter */}
      <MotiView
        from={{ translateY: -100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Pandit, Puja..."
            placeholderTextColor="#999"
            value={filter.searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </MotiView>

      {/* Content */}
      {isLoading && !refreshing && pandits.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Finding the best Pandits...</Text>
        </View>
      ) : (
        <FlatList
          data={pandits}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
        />
      )}

      {/* Filter Sheet */}
      <PanditFilterSheet
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  clearButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
