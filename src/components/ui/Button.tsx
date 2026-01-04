import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ 
  title, 
  variant = 'primary', 
  loading = false, 
  style, 
  textStyle, 
  disabled,
  ...props 
}: ButtonProps) => {
  
  const getBackgroundColor = () => {
    if (disabled) return '#E0E0E0';
    switch (variant) {
      case 'primary': return Colors.light.primary;
      case 'secondary': return Colors.light.deepRed;
      case 'outline': return 'transparent';
      case 'text': return 'transparent';
      default: return Colors.light.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#9E9E9E';
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary': return '#FFFFFF';
      case 'outline': return Colors.light.primary;
      case 'text': return Colors.light.primary;
      default: return '#FFFFFF';
    }
  };

  const getBorder = () => {
    if (variant === 'outline' && !disabled) {
      return { borderWidth: 1, borderColor: Colors.light.primary };
    }
    return {};
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
