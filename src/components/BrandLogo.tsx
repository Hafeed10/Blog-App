import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Image, ImageSourcePropType } from 'react-native';

interface BrandLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  source?: ImageSourcePropType;
  iconColor?: string;
  backgroundColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 32,
  style,
  borderRadius,
  source = require('../../assets/brand-logo.png'),
}) => {
  const radius = borderRadius ?? Math.round(size * 0.25);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BrandLogo;
