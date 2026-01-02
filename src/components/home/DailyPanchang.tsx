import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors } from '@/constants/Colors';

export const DailyPanchang = () => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 600, delay: 200 }}
      style={styles.container}
    >
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1604881991720-f91add269ed8?q=80&w=1000&auto=format&fit=crop' }} // Placeholder abstract spiritual background
        style={styles.background}
        imageStyle={{ borderRadius: 16, opacity: 0.15 }}
      >
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{dateString}</Text>
            <Text style={styles.tithiText}>Shukla Paksha, Tritiya</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="sunny" size={24} color={Colors.light.primary} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="sunny-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Sunrise</Text>
            <Text style={styles.detailValue}>06:45 AM</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="moon-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Sunset</Text>
            <Text style={styles.detailValue}>05:30 PM</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="star-outline" size={16} color="#666" />
            <Text style={styles.detailLabel}>Nakshatra</Text>
            <Text style={styles.detailValue}>Rohini</Text>
          </View>
        </View>
      </ImageBackground>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  background: {
    padding: 16,
    backgroundColor: '#FFF8E1', // Light saffron tint
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  tithiText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
