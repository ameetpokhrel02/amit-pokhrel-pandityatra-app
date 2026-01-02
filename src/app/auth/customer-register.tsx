import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';

export default function CustomerRegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  const handleSubmit = () => {
    // TODO: Submit registration
    // For now, redirect to OTP or Login
    router.push({ pathname: '/auth/otp', params: { identifier: form.phone, method: 'phone' } } as any);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Join as Customer</Text>
        <Text style={styles.headerSubtitle}>Create an account to book Pujas</Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={form.fullName}
            onChangeText={(t) => setForm({ ...form, fullName: t })}
          />
          
          <Input
            label="Phone Number"
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <Button 
            title="Continue" 
            onPress={handleSubmit} 
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/auth/login' as any)}>Login</Text>
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
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  link: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
});
