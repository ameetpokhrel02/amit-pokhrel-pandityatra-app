import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';

interface CustomPhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFormattedChange: (text: string) => void;
}

export const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({ value, onChangeText, onFormattedChange }) => {
  const [countryCode, setCountryCode] = useState<CountryCode>('NP');
  const [callingCode, setCallingCode] = useState<string>('977');
  const [visible, setVisible] = useState(false);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    onFormattedChange(`+${country.callingCode[0]}${value}`);
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    onFormattedChange(`+${callingCode}${text}`);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.countryPickerContainer}
        onPress={() => setVisible(true)}
      >
        <CountryPicker
          withFilter
          withFlag
          withCallingCode
          withEmoji
          onSelect={onSelect}
          countryCode={countryCode}
          visible={visible}
          onClose={() => setVisible(false)}
        />
        <Text style={styles.callingCodeText}>+{callingCode}</Text>
      </TouchableOpacity>
      
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleTextChange}
        keyboardType="phone-pad"
        placeholder="Phone Number"
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    height: 56,
  },
  countryPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: '100%',
  },
  callingCodeText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingHorizontal: 12,
    height: '100%',
  },
});
