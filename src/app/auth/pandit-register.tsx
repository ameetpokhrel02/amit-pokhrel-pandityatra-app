import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';

export default function PanditRegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    experience: '',
    vedicSchool: '',
  });

  const handleSubmit = () => {
    // TODO: Submit registration
    alert('Registration submitted! We will contact you shortly.');
    router.replace('/auth/login' as any);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Join as a Pandit</Text>
        <Text style={styles.headerSubtitle}>Fill in your details to register with PanditYatra</Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Acharya Name"
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
            placeholder="pandit@example.com"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <Input
            label="Years of Experience"
            placeholder="e.g. 5 years"
            keyboardType="numeric"
            value={form.experience}
            onChangeText={(t) => setForm({ ...form, experience: t })}
          />

          <Input
            label="Vedic School / Gurukul (Optional)"
            placeholder="Enter school name"
            value={form.vedicSchool}
            onChangeText={(t) => setForm({ ...form, vedicSchool: t })}
          />

          <Button 
            title="Submit Registration" 
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
    fontFamily: 'Playfair Display',
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 32,
  },
  form: {
    backgroundColor: Colors.light.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
