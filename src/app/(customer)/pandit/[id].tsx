import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';
import { Colors } from '@/constants/Colors';
import { PanditService } from '@/services/pandit.service';
import { Pandit } from '@/types/pandit';

export default function PanditProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pandit, setPandit] = useState<Pandit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPandit = async () => {
      if (typeof id === 'string') {
        const data = await PanditService.getPanditById(id);
        setPandit(data || null);
      }
      setLoading(false);
    };
    loadPandit();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!pandit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pandit not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: pandit.image }} style={styles.image} />
          <View style={styles.overlay} />
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <MotiView 
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={styles.contentContainer}
        >
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{pandit.name}</Text>
              {pandit.isVerified && <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />}
            </View>
            <Text style={styles.location}>
              <Ionicons name="location" size={14} color="#666" /> {pandit.location}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pandit.rating} <Ionicons name="star" size={12} color="#FFD700" /></Text>
                <Text style={styles.statLabel}>{pandit.reviewCount} Reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pandit.experience}+ Years</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pandit.isAvailable ? 'Yes' : 'No'}</Text>
                <Text style={[styles.statLabel, { color: pandit.isAvailable ? 'green' : 'red' }]}>
                  {pandit.isAvailable ? 'Available' : 'Busy'}
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {pandit.name} is a highly experienced Vedic scholar specializing in {pandit.specialization.join(', ')}. 
              With over {pandit.experience} years of dedicated service, he has performed numerous ceremonies across {pandit.location}.
              He is fluent in {pandit.languages.join(', ')} and ensures all rituals are performed with utmost devotion and accuracy.
            </Text>
          </View>

          {/* Specializations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specializations</Text>
            <View style={styles.tagsContainer}>
              {pandit.specialization.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.tagsContainer}>
              {pandit.languages.map((lang, index) => (
                <View key={index} style={styles.langTag}>
                  <Text style={styles.langTagText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Preview (Mock) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.avatarText}>R</Text>
                  </View>
                  <Text style={styles.reviewerName}>Ramesh K.</Text>
                </View>
                <View style={styles.reviewRating}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.reviewRatingText}>5.0</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>
                Very knowledgeable and punctual. The Griha Pravesh puja was conducted beautifully. Highly recommended!
              </Text>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      {/* Bottom Action Bar */}
      <MotiView 
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 300 }}
        style={styles.bottomBar}
      >
        <View>
          <Text style={styles.priceLabel}>Dakshina starts from</Text>
          <Text style={styles.priceValue}>NPR {pandit.price}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookButton, !pandit.isAvailable && styles.bookButtonDisabled]}
          onPress={() => router.push(`/(customer)/booking?panditId=${pandit.id}`)}
          disabled={!pandit.isAvailable}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    marginTop: -40,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  headerInfo: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  section: {
    marginBottom: 24,
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
    marginBottom: 8,
  },
  seeAllText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  tagText: {
    color: '#E65100',
    fontSize: 14,
  },
  langTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langTagText: {
    color: '#666',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  bookButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
