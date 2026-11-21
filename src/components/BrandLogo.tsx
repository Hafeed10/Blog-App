import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BrandLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  backgroundColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  style,
  iconColor = '#2563EB',
  backgroundColor = '#FFFFFF',
}) => {
  const borderRadius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.62);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
          borderColor: 'rgba(37, 99, 235, 0.22)',
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
    >
      <Ionicons name="chevron-up" size={iconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default BrandLogo;
