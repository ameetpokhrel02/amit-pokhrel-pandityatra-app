import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function PanditsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Pandit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
});
