import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/store/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');

  const handleLogin = () => {
    if (method === 'phone') {
      const success = login(identifier);
      if (success) {
        router.replace('/(customer)' as any);
      } else {
        // For demo purposes, if user not found, we can still allow login or show error.
        // But the user asked to "dilau his name", so we need the registered user.
        // If not found, maybe show alert "User not found, please register".
        // However, for testing without registering every time, maybe we can just set a dummy user if not found?
        // No, the user specifically said "if amit pokhrel user create account navitaig him for login and dilau his name".
        // So we should enforce registration.
        Alert.alert('Login Failed', 'User not found. Please register first.');
      }
    } else {
      // Email login not implemented in context yet, just redirect
      router.replace('/(customer)' as any);
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

          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordLink} onPress={() => router.push('/auth/forgot-password' as any)}>
              Forgot Password?
            </Text>
          </View>

          <Button 
            title="Login" 
            onPress={handleLogin} 
            style={styles.submitButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/auth/customer-register' as any)}>Register</Text>
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
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.text,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordLink: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
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

