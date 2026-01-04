import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '@/constants/Colors';

export default function OTPScreen() {
  const router = useRouter();
  const { identifier, method } = useLocalSearchParams();
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    if (otp.length === 6) {
      // TODO: Verify OTP API
      // Mock success
      // Determine user role (mock logic)
      // In a real app, the API response would contain the user role
      const isPandit = false; // Change this to true to test Pandit flow
      
      if (isPandit) {
        router.replace('/(pandit)' as any);
      } else {
        router.replace('/(customer)' as any);
      }
    } else {
      alert('Please enter a valid 6-digit OTP');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/pandit-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Verify OTP Code</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {identifier || 'your phone/email'}
          </Text>

          <Input
            label="OTP Code"
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.otpInput}
          />

          <Button 
            title="Verify" 
            onPress={handleVerify} 
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive code? </Text>
            <Text style={styles.link} onPress={() => alert('Resend OTP')}>Resend</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpInput: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#757575',
  },
  link: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
