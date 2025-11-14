import React from 'react';
import { Text, TouchableOpacity, TextInput as RNInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Card({ children, style }) {
  const t = useTheme();
  return <View style={[{ backgroundColor:t.colors.card, borderRadius:t.radius, padding:14, borderWidth:1, borderColor:t.colors.border }, t.shadow, style]}>{children}</View>;
}

export function Button({ title, onPress, variant='primary', style, disabled }) {
  const t = useTheme();
  const base = { paddingVertical:12, alignItems:'center', borderRadius:t.radius };
  const styles = variant === 'ghost'
    ? [{ backgroundColor:'transparent', borderWidth:1, borderColor:t.colors.border }]
    : [{ backgroundColor: disabled ? '#a7f3d0' : t.colors.primary }];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[base, ...styles, style]}>
      <Text style={{ color: variant === 'ghost' ? t.colors.text : '#fff', fontWeight:'700' }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Input(props) {
  const t = useTheme();
  return (
    <RNInput
      {...props}
      style={[{ borderWidth:1, borderColor:t.colors.border, padding:12, borderRadius:t.radius, backgroundColor:'#fff' }, props.style]}
      autoCapitalize={props.autoCapitalize ?? 'none'}
    />
  );
}
