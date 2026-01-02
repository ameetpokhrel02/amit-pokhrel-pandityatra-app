import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');

  const handleRequestOTP = () => {
    // TODO: Validate input
    // TODO: Call API to send OTP
    router.push({ pathname: '/auth/otp', params: { identifier, method } } as any);
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

          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Enter your details to login</Text>

          <View style={styles.methodContainer}>
            <Button 
              title="Phone" 
              variant={method === 'phone' ? 'primary' : 'outline'} 
              onPress={() => setMethod('phone')}
              style={styles.methodButton}
            />
            <Button 
              title="Email" 
              variant={method === 'email' ? 'primary' : 'outline'} 
              onPress={() => setMethod('email')}
              style={styles.methodButton}
            />
          </View>

          <Input
            label={method === 'phone' ? "Phone Number" : "Email Address"}
            placeholder={method === 'phone' ? "Enter your phone number" : "Enter your email"}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
          />

          <Button 
            title="Request OTP" 
            onPress={handleRequestOTP} 
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/auth/register' as any)}>Register</Text>
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
    width: 80,
    height: 80,
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
    marginBottom: 24,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
  },
  submitButton: {
    marginTop: 12,
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

