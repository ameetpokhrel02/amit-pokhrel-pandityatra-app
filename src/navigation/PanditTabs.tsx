import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PanditDashboard from '../app/pandit/dashboard';

const Tab = createBottomTabNavigator();

export default function PanditTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={PanditDashboard} />
      <Tab.Screen name="Calendar" component={PanditDashboard} />
      <Tab.Screen name="Earnings" component={PanditDashboard} />
      <Tab.Screen name="Profile" component={PanditDashboard} />
    </Tab.Navigator>
  );
}

