import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(customer)/profile')}>
            <Ionicons name="person-circle-outline" size={40} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Next Booking Reminder */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <Ionicons name="calendar" size={16} color="#FFF" />
            <Text style={styles.reminderTitle}>Next Puja: Bratabandha</Text>
          </View>
          <Text style={styles.reminderTime}>15 Jan 2026, 10:00 AM</Text>
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
        <QuickActionButton icon="add-circle-outline" label="Book Puja" onPress={() => router.push('/(customer)/pandits')} />
        <QuickActionButton icon="basket-outline" label="Shop Samagri" onPress={() => router.push('/(customer)/shop')} />
        <QuickActionButton icon="planet-outline" label="Generate Kundali" onPress={() => {}} />
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/bookings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <BookingCard 
            date="15 Jan" 
            time="10:00 AM" 
            panditName="Pt. Sharma" 
            pujaType="Bratabandha" 
            status="Confirmed" 
          />
          <BookingCard 
            date="22 Jan" 
            time="08:00 AM" 
            panditName="Pt. Joshi" 
            pujaType="Satyanarayan" 
            status="Pending" 
          />
        </ScrollView>
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

      {/* Recent Purchases / Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <ProductCard name="Puja Thali Set" price="₹1,200" />
          <ProductCard name="Ghee Lamp" price="₹450" />
          <ProductCard name="Incense Sticks" price="₹150" />
        </ScrollView>
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

function BookingCard({ date, time, panditName, pujaType, status }: { date: string, time: string, panditName: string, pujaType: string, status: string }) {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingDate}>{date}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status === 'Confirmed' ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: status === 'Confirmed' ? '#166534' : '#92400E' }]}>{status}</Text>
        </View>
      </View>
      <Text style={styles.bookingTitle}>{pujaType}</Text>
      <Text style={styles.bookingPandit}>{panditName} <Ionicons name="checkmark-circle" size={12} color={Colors.light.primary} /></Text>
      <Text style={styles.bookingTime}>{time}</Text>
      <TouchableOpacity style={styles.viewDetailsButton}>
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProductCard({ name, price }: { name: string, price: string }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="basket-outline" size={30} color="#ccc" />
      </View>
      <Text style={styles.productName}>{name}</Text>
      <Text style={styles.productPrice}>{price}</Text>
      <TouchableOpacity style={styles.addToCartButton}>
        <Text style={styles.addToCartText}>Add</Text>
      </TouchableOpacity>
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
  profileButton: {
    padding: 4,
  },
  reminderCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reminderTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reminderTime: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
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
    marginBottom: 10,
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
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    elevation: 2,
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingPandit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  productCard: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    elevation: 2,
    marginBottom: 10,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
