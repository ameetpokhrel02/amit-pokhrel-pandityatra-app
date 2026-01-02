import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

export default function CustomerHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste, Anita!</Text>
            <Text style={styles.subGreeting}>Find peace and blessings today</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Book a Pandit for your Puja</Text>
            <Text style={styles.bannerSubtitle}>Verified Pandits • Authentic Rituals</Text>
            <TouchableOpacity style={styles.bannerButton} onPress={() => router.push('/(customer)/pandits')}>
              <Text style={styles.bannerButtonText}>Find a Pandit</Text>
            </TouchableOpacity>
          </View>
          {/* Placeholder for banner image */}
          <View style={styles.bannerImagePlaceholder}>
             <Ionicons name="flower-outline" size={60} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput 
            placeholder="Search Pandit / Occasion / City" 
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={Colors.light.white} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickActionButton icon="add-circle-outline" label="Book Now" onPress={() => router.push('/(customer)/pandits')} />
        <QuickActionButton icon="basket-outline" label="Shop Samagri" onPress={() => router.push('/(customer)/cart')} />
        <QuickActionButton icon="planet-outline" label="Kundali" onPress={() => {}} />
      </View>

      {/* Featured Pandits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Pandits</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/pandits')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <PanditCard name="Pt. Sharma" rating={4.9} location="Kathmandu" />
          <PanditCard name="Pt. Joshi" rating={4.8} location="Lalitpur" />
          <PanditCard name="Pt. Bhatta" rating={4.7} location="Bhaktapur" />
        </ScrollView>
      </View>

      {/* Upcoming Bookings (Mock) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Puja</Text>
        <View style={styles.bookingCard}>
          <View style={styles.bookingDate}>
            <Text style={styles.bookingDay}>12</Text>
            <Text style={styles.bookingMonth}>JAN</Text>
          </View>
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>Satyanarayan Puja</Text>
            <Text style={styles.bookingTime}>10:00 AM • Home</Text>
          </View>
          <TouchableOpacity style={styles.viewButton} onPress={() => router.push('/(customer)/bookings')}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function QuickActionButton({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={24} color={Colors.light.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function PanditCard({ name, rating, location }: { name: string, rating: number, location: string }) {
  return (
    <View style={styles.panditCard}>
      <View style={styles.panditImagePlaceholder}>
        <Ionicons name="person" size={40} color="#ccc" />
      </View>
      <View style={styles.panditInfo}>
        <Text style={styles.panditName}>{name} <Ionicons name="checkmark-circle" size={14} color={Colors.light.primary} /></Text>
        <Text style={styles.panditLocation}>{location}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  heroSection: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF7ED', // Cream
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    fontFamily: 'Playfair Display',
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.light.text,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    elevation: 2,
  },
  banner: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerImagePlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    marginTop: -25,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FDE68A', // Gold-ish
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Playfair Display',
  },
  seeAll: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  panditCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    elevation: 2,
    marginBottom: 10, // For shadow
  },
  panditImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panditInfo: {
    gap: 4,
  },
  panditName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  panditLocation: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  bookingDate: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 16,
  },
  bookingDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  bookingMonth: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
