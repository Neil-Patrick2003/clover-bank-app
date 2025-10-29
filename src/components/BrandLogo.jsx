import React from 'react';
import { Image, View, Text } from 'react-native';

export default function BrandLogo({ compact = false }) {
  if (compact) {
    return (
      <Image
        source={require('../../assets/brand/logo.png')}
        style={{ width: 28, height: 28, borderRadius: 6 }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={require('../../assets/brand/logo.png')}
        style={{ width: 28, height: 28, borderRadius: 6 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#065f46' }}>Clover Bank</Text>
    </View>
  );
}
