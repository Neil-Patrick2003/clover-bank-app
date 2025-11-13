import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { api } from '../api/client';
import { Button, Card } from './ui';
import { useTheme } from '../theme/ThemeProvider';

export default function ApiTestComponent() {
  const t = useTheme();
  const [status, setStatus] = useState('Ready to test');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    
    try {
      // Test basic API connectivity - try a route that should exist
      const response = await api.get('/auth/me', { timeout: 5000 });
      setStatus(`✅ Connection successful: ${response.status}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        setStatus('❌ Connection refused - Laravel server not running');
      } else if (error.response?.status === 401) {
        setStatus('✅ Connection successful! Laravel API is responding (401 = not authenticated)');
      } else if (error.response?.status === 404) {
        setStatus('❌ API route not found - check Laravel routes');
      } else {
        setStatus(`❌ Connection error: ${error.message}`);
      }
      console.error('Connection test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setStatus('Testing login with sample account...');
    
    try {
      const response = await api.post('/auth/login', {
        email: 'maria.santos@example.com',
        password: 'Maria@2023'
      });
      
      setStatus(`✅ Login successful! Token received: ${response.data.token ? 'Yes' : 'No'}`);
      Alert.alert('Success', 'Login test successful!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setStatus(`❌ Login failed: ${errorMsg}`);
      Alert.alert('Login Failed', errorMsg);
      console.error('Login test error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    setStatus('Testing registration...');
    
    try {
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;
      const testUsername = `testuser${timestamp}`;
      
      const response = await api.post('/auth/register', {
        name: testUsername, // Laravel validation expects 'name' field
        username: testUsername,
        email: testEmail,
        password: 'Test@123',
        password_confirmation: 'Test@123' // Laravel validation expects password confirmation
      });
      
      setStatus(`✅ Registration successful! Token: ${response.data.token ? 'Yes' : 'No'}`);
      Alert.alert('Success', `Registration test successful!\nUsername: ${testUsername}\nEmail: ${testEmail}`);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      setStatus(`❌ Registration failed: ${errorMsg} ${errorDetails}`);
      Alert.alert('Registration Failed', `${errorMsg}\n${errorDetails}`);
      console.error('Registration test error:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ margin: 16, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.text }}>
        🔧 API Connection Test
      </Text>
      
      <Text style={{ 
        color: status.includes('✅') ? t.colors.success : status.includes('❌') ? t.colors.danger : t.colors.text,
        fontWeight: '600'
      }}>
        Status: {status}
      </Text>

      <View style={{ gap: 8 }}>
        <Button 
          title="Test Connection" 
          onPress={testConnection} 
          disabled={loading}
        />
        
        <Button 
          title="Test Login (maria.santos@example.com)" 
          onPress={testLogin} 
          disabled={loading}
        />
        
        <Button 
          title="Test Registration" 
          onPress={testRegister} 
          disabled={loading}
        />
      </View>

      <Text style={{ fontSize: 12, color: t.colors.sub, marginTop: 8 }}>
        Check console logs for detailed API information
      </Text>
    </Card>
  );
}
