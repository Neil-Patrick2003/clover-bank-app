import React from 'react';
import { Text, TouchableOpacity, TextInput as RNInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Card({ children, style }) {
  const t = useTheme();
  return (
    <View style={[
      { 
        backgroundColor: t.colors.card || t.colors.background, 
        borderRadius: t.radius || 8, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: t.colors.border 
      }, 
      t.shadow, 
      style
    ]}>
      {children}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', style, disabled, textStyle, color }) {
  const t = useTheme();
  
  const base = { 
    paddingVertical: 12, 
    paddingHorizontal: 16,
    alignItems: 'center', 
    borderRadius: t.radius || 8,
    minHeight: 44,
    justifyContent: 'center'
  };

  const getButtonStyle = () => {
    if (disabled) {
      return { 
        backgroundColor: t.colors.disabled || '#e5e7eb',
        borderWidth: 0
      };
    }
    
    if (variant === 'ghost') {
      return { 
        backgroundColor: 'transparent', 
        borderWidth: 1, 
        borderColor: color || t.colors.primary 
      };
    }
    
    return { 
      backgroundColor: color || t.colors.primary 
    };
  };

  const getTextStyle = () => {
    if (disabled) {
      return { color: t.colors.textSecondary || '#6b7280', fontWeight: '600' };
    }
    
    if (variant === 'ghost') {
      return { color: color || t.colors.primary, fontWeight: '600' };
    }
    
    return { color: '#ffffff', fontWeight: '600' };
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled} 
      style={[base, getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Input(props) {
  const t = useTheme();
  const { rightIcon, inputStyle, style, ...restProps } = props;
  
  const baseInputStyle = {
    borderWidth: 1, 
    borderColor: t.colors.border, 
    padding: 12, 
    borderRadius: t.radius || 8, 
    backgroundColor: '#ffffff',
    fontSize: 16,
    minHeight: 44
  };

  if (rightIcon) {
    return (
      <View style={[
        { 
          flexDirection: 'row', 
          alignItems: 'center', 
          borderWidth: 1, 
          borderColor: t.colors.border, 
          borderRadius: t.radius || 8, 
          backgroundColor: '#ffffff',
          minHeight: 44
        }, 
        style
      ]}>
        <RNInput
          {...restProps}
          style={[
            { 
              flex: 1, 
              padding: 12, 
              paddingRight: 8,
              fontSize: 16
            }, 
            inputStyle
          ]}
          placeholderTextColor={t.colors.textSecondary || '#6b7280'}
          autoCapitalize={restProps.autoCapitalize ?? 'none'}
        />
        {rightIcon}
      </View>
    );
  }
  
  return (
    <RNInput
      {...restProps}
      style={[baseInputStyle, style]}
      placeholderTextColor={t.colors.textSecondary || '#6b7280'}
      autoCapitalize={restProps.autoCapitalize ?? 'none'}
    />
  );
}