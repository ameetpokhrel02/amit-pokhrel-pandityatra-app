import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface RotatingChakraProps {
  size?: number;
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
}

/** A slow, continuous spin on the zodiac wheel — the ambient "living chart" feel used on astrology sites like vaikunth.co. */
export const RotatingChakra = ({ size = 140, durationMs = 26000, style }: RotatingChakraProps) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, durationMs]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ rotate }] }, style]}>
      <Image
        source={require('@/assets/images/astro-chakra.png')}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
      />
    </Animated.View>
  );
};
