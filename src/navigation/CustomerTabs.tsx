import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import HomeScreen from '../app/customer/home';
import ChatListScreen from '../app/(customer)/chat/index';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';

const Tab = createBottomTabNavigator();

export default function CustomerTabs() {
  const router = useRouter();

  return (
    <Tab.Navigator 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          headerShown: true,
          headerTitle: 'PanditYatra',
          headerTintColor: Colors.light.primary,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(customer)/chat' as any)}
              style={{ marginRight: 16 }}
            >
              <IconSymbol name="message.fill" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Pandits" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <IconSymbol name="person.2.fill" size={24} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <IconSymbol name="person.circle.fill" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
