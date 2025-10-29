import React from 'react';
import { Text } from 'react-native';

export default function ErrorMessage({ error }) {
  if (!error) return null;
  return <Text style={{ color: 'crimson', marginVertical: 8 }}>{error}</Text>;
}
