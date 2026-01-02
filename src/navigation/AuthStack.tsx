import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../app/auth/login';
import OtpScreen from '../app/auth/otp';

export type AuthStackParamList = {
  Login: undefined;
  Otp: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}
