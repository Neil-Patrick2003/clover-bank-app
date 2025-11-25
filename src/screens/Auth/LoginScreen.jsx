import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Input, Button, Card } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

// --- CUSTOM ICON COMPONENT (For Password Toggle) ---
const Icon = ({ name, size, color, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={{ 
            padding: 10, 
            justifyContent: 'center', 
            alignItems: 'center',
            minWidth: 44,
            minHeight: 44,
            borderRadius: 8,
            marginLeft: -8
        }}
        activeOpacity={0.6}
    >
        <Text style={{ 
            fontSize: size, 
            color: color, 
            lineHeight: size,
            textAlign: 'center'
        }}>
            {name === 'eye-off' ? '🚫' : '👁️'}
        </Text>
    </TouchableOpacity>
);

export default function LoginScreen({ navigation }) {
  const t = useTheme(); 
  const { login } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password toggle

  const submit = async () => {
    setMsg('');
    try { 
        await login(email.trim(), password); 
    }
    catch (e) { 
        setMsg(e?.response?.data?.message || 'Login failed'); 
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.bg }]}>
      
      {/* Aesthetic Background Element (Green Touch) */}
      <View style={[
          styles.backgroundShape, 
          { backgroundColor: t.colors.primary, opacity: 0.15 } 
      ]} />
      
      {/* Centered Form Card */}
      <View style={styles.contentWrapper}>
          <Card style={[styles.card, { 
              gap: 15, // Increased spacing
              borderColor: t.colors.border, 
          }]}>
            
            {/* Header with Green Accent */}
            <Text style={styles.subHeader}>SECURE ACCESS</Text>
            <Text style={[styles.header, { color: t.colors.text }]}>
                Welcome Back
            </Text>
            
            {/* Email Input */}
            <Input 
                placeholder="Email Address" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            {/* Password Input with Show/Hide Toggle */}
            <Input 
                placeholder="Password" 
                value={password} 
                onChangeText={setPassword} 
                // Toggle security based on state
                secureTextEntry={!showPassword} 
                rightIcon={
                    <Icon
                        name={showPassword ? 'eye' : 'eye-off'} 
                        size={20}
                        color={t.colors.textSecondary}
                        onPress={() => setShowPassword(!showPassword)}
                    />
                }
            />
            
            {/* Forgot Password Link (Common Modern Feature) */}
            <TouchableOpacity style={styles.forgotPassword}>
                <Text style={{ color: t.colors.primary, fontWeight: '600' }}>
                    Forgot Password?
                </Text>
            </TouchableOpacity>

            {/* Error Message */}
            {msg ? (
                <Text style={styles.errorText}>{msg}</Text>
            ) : null}
            
            {/* Primary Action Button (Green Focus) */}
            <Button 
                title="Sign In" 
                onPress={submit} 
                color={t.colors.primary} 
                style={{ marginTop: 10 }}
            />
            
            {/* Secondary Action Button (Ghost/Outline) */}
            <Button 
                title="Create account" 
                variant="ghost" 
                onPress={() => navigation.navigate('Register')} 
                color={t.colors.primary} 
            />
          </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden', 
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, 
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 30, 
    borderRadius: 12, 
    elevation: 8, 
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6aa84f', 
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  header: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20, 
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 5,
  },
  backgroundShape: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150, 
  },
});