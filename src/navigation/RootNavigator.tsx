import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AuthStack from './AuthStack';
import CustomerTabs from './CustomerTabs';

// TEMP: fake auth state (we’ll replace with Zustand)
const isLoggedIn = false;
const role: 'customer' | 'pandit' | 'admin' = 'customer';

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (e.g., checking auth token)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loading

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        {isLoggedIn ? <CustomerTabs /> : <AuthStack />}
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
