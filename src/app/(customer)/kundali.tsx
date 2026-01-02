import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

export default function KundaliScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    tob: '',
    place: '',
    gender: ''
  });

  return (
    <View style={styles.container}>
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Kundali</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* 1. Hero Section */}
        <View style={styles.heroSection}>
            <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{
                    type: 'timing',
                    duration: 20000,
                    loop: true,
                    repeatReverse: false,
                }}
                style={styles.heroIconContainer}
            >
                <Ionicons name="planet-outline" size={64} color="#f97316" />
            </MotiView>
            <Text style={styles.heroTitle}>Offline Kundali – Your Birth Chart, Private & Secure</Text>
            <Text style={styles.heroSubtitle}>Generate your Kundali without internet. Your data stays on your device.</Text>
            <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1.05 }}
                transition={{
                    type: 'timing',
                    duration: 1500,
                    loop: true,
                }}
            >
                <TouchableOpacity style={styles.heroButton} onPress={() => {}}>
                    <Text style={styles.heroButtonText}>Generate Kundali</Text>
                </TouchableOpacity>
            </MotiView>
        </View>

        {/* 2. What Is Offline Kundali? */}
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>What Is Offline Kundali?</Text>
            <Text style={styles.sectionText}>
                Offline Kundali generates your birth chart using Vedic astrology algorithms directly on your device. No internet required. No data sent to servers.
            </Text>
            <View style={styles.featureRow}>
                <View style={styles.featureItem}>
                    <Ionicons name="cloud-offline-outline" size={24} color="#f97316" />
                    <Text style={styles.featureText}>Works Offline</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="lock-closed-outline" size={24} color="#f97316" />
                    <Text style={styles.featureText}>100% Private</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="document-text-outline" size={24} color="#f97316" />
                    <Text style={styles.featureText}>PDF Download</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="planet-outline" size={24} color="#f97316" />
                    <Text style={styles.featureText}>Vedic Astrology</Text>
                </View>
            </View>
        </View>

        {/* 3. Kundali Input Form */}
        <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Enter Birth Details</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Enter your full name" 
                    value={formData.name}
                    onChangeText={(t) => setFormData({...formData, name: t})}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <View style={styles.dateInputContainer}>
                        <TextInput 
                            style={styles.dateInput} 
                            placeholder="DD/MM/YYYY" 
                            value={formData.dob}
                            onChangeText={(t) => setFormData({...formData, dob: t})}
                        />
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                    </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Time of Birth</Text>
                    <View style={styles.dateInputContainer}>
                        <TextInput 
                            style={styles.dateInput} 
                            placeholder="HH:MM" 
                            value={formData.tob}
                            onChangeText={(t) => setFormData({...formData, tob: t})}
                        />
                        <Ionicons name="time-outline" size={20} color="#666" />
                    </View>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Place of Birth</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="City, Country" 
                    value={formData.place}
                    onChangeText={(t) => setFormData({...formData, place: t})}
                />
            </View>

            <TouchableOpacity style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Generate Kundali</Text>
            </TouchableOpacity>
        </View>

        {/* 4. What You Will Get */}
        <View style={styles.section}>
            <Text style={styles.sectionHeader}>What You Will Get</Text>
            <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                    <Ionicons name="pie-chart-outline" size={20} color="#fbbf24" />
                    <Text style={styles.previewTitle}>Kundali Components</Text>
                </View>
                <Text style={styles.previewList}>• Lagna (Ascendant)</Text>
                <Text style={styles.previewList}>• Rashi Chart</Text>
                <Text style={styles.previewList}>• Navamsa Chart</Text>
                <Text style={styles.previewList}>• Planet Positions</Text>
            </View>
            <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                    <Ionicons name="sparkles-outline" size={20} color="#fbbf24" />
                    <Text style={styles.previewTitle}>Predictions</Text>
                </View>
                <Text style={styles.previewList}>• Personality Traits</Text>
                <Text style={styles.previewList}>• Career Indications</Text>
                <Text style={styles.previewList}>• Marriage Insights</Text>
                <Text style={styles.previewList}>• Auspicious Timings</Text>
            </View>
        </View>

        {/* 5. Privacy Assurance */}
        <View style={styles.privacyCard}>
            <Ionicons name="lock-closed" size={32} color="#f97316" />
            <Text style={styles.privacyTitle}>Your data never leaves your phone</Text>
            <Text style={styles.privacyText}>Kundali is generated offline using secure algorithms. No upload. No tracking. No ads.</Text>
        </View>

        {/* 7. Optional Add-ons */}
        <View style={styles.addonsContainer}>
            <TouchableOpacity style={styles.addonCard}>
                <Ionicons name="people-outline" size={24} color="#333" />
                <Text style={styles.addonText}>Book Pandit for Explanation</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addonCard}>
                <Ionicons name="heart-outline" size={24} color="#333" />
                <Text style={styles.addonText}>Match Kundali for Marriage</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff7ed', // Cream background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#fff7ed',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        padding: 24,
    },
    heroIconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    heroButton: {
        backgroundColor: '#f97316', // Saffron
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
    },
    heroButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    },
    sectionText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    featureItem: {
        width: '45%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 1,
    },
    featureText: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 20,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    dateInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    generateButton: {
        backgroundColor: '#f97316',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#fbbf24', // Gold
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    previewList: {
        fontSize: 14,
        color: '#666',
        marginLeft: 28,
        marginBottom: 4,
    },
    privacyCard: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    privacyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    addonsContainer: {
        padding: 20,
        gap: 12,
    },
    addonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'space-between',
    },
    addonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
});
