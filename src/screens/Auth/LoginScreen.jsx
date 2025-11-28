import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Input, Button } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

const Icon = ({ name, size, color, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={{ 
            padding: 8,
            justifyContent: 'center', 
            alignItems: 'center',
            minWidth: 40,
            minHeight: 40,
            borderRadius: 6,
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setMsg('');
    setIsLoading(true);
    try { 
        await login(email.trim(), password); 
    }
    catch (e) { 
        setMsg(e?.response?.data?.message || 'Login failed'); 
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        
        {/* Header Section - Compact */}
        <View style={styles.headerSection}>
          <Text style={[styles.welcomeText, { color: t.colors.text }]}>
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
            Sign in to continue
          </Text>
        </View>

        {/* Form Section - Compact */}
        <View style={styles.formSection}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: t.colors.text }]}>
              Email
            </Text>
            <Input 
                placeholder="Enter your email" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: t.colors.border }]}
            />
          </View>
          
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.inputLabel, { color: t.colors.text }]}>
                Password
              </Text>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={{ color: t.colors.primary, fontSize: 13, fontWeight: '500' }}>
                  Forgot?
                </Text>
              </TouchableOpacity>
            </View>
            <Input 
                placeholder="Enter your password" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} 
                rightIcon={
                    <Icon
                        name={showPassword ? 'eye' : 'eye-off'} 
                        size={18}
                        color={t.colors.textSecondary}
                        onPress={() => setShowPassword(!showPassword)}
                    />
                }
                style={[styles.input, { borderColor: t.colors.border }]}
            />
          </View>

          {/* Error Message */}
          {msg ? (
              <Text style={[styles.errorText, { color: t.colors.error }]}>{msg}</Text>
          ) : null}

          {/* Sign In Button */}
          <Button 
            title={isLoading ? "Signing in..." : "Sign In"} 
            onPress={submit} 
            color={t.colors.primary}
            style={styles.signInButton}
            disabled={isLoading}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
            <Text style={[styles.dividerText, { color: t.colors.textSecondary }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
          </View>

          {/* Create Account */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpText, { color: t.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.signUpLink, { color: t.colors.primary }]}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Background Accent Elements - Smaller */}
        <View style={[styles.backgroundAccent, { backgroundColor: t.colors.primary }]} />
        <View style={[styles.backgroundAccent2, { backgroundColor: t.colors.primary }]} />
        
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
  },
  forgotPassword: {
    padding: 2,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  signInButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  backgroundAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.05,
    zIndex: -1,
  },
  backgroundAccent2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.03,
    zIndex: -1,
  },
});