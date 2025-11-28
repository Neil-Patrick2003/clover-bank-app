import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const t = useTheme();
  const [kycData, setKycData] = useState(null);
  const [accountNumber, setAccountNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    console.log('ProfileScreen - User data:', user);
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch KYC profile
      try {
        console.log('Fetching KYC profile...');
        const kycResponse = await api.get('/kyc/profile');
        console.log('KYC Response Status:', kycResponse.status);
        console.log('KYC Response Data:', kycResponse.data);
        
        // Handle different response formats
        if (kycResponse.data) {
          // If response has a 'data' property, use that
          const kycPayload = kycResponse.data.data || kycResponse.data;
          setKycData(kycPayload);
          console.log('KYC Data Set:', kycPayload);
        }
      } catch (kycErr) {
        console.error('KYC profile fetch failed:');
        console.error('Status:', kycErr?.response?.status);
        console.error('Data:', kycErr?.response?.data);
        console.error('Message:', kycErr?.message);
      }
      
      // Fetch accounts to get account number
      try {
        console.log('Fetching accounts...');
        const accountsResponse = await api.get('/accounts');
        console.log('Accounts Response:', accountsResponse.data);
        
        if (accountsResponse.data) {
          const accountsList = accountsResponse.data.data || accountsResponse.data;
          if (Array.isArray(accountsList) && accountsList.length > 0) {
            setAccountNumber(accountsList[0].account_number);
            console.log('Account number set:', accountsList[0].account_number);
          }
        }
      } catch (accErr) {
        console.error('Accounts fetch failed:');
        console.error('Status:', accErr?.response?.status);
        console.error('Data:', accErr?.response?.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout button pressed!');
    
    // For mobile platforms, show Alert
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', onPress: () => { console.log('Logout cancelled'); }, style: 'cancel' },
          {
            text: 'Logout',
            onPress: performLogout,
            style: 'destructive',
          },
        ]
      );
    } else {
      // For web, use window.confirm
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      } else {
        console.log('Logout cancelled');
      }
    }
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);
      console.log('Starting logout...');
      await logout();
      console.log('Logout completed, navigating to Login...');
      setLoggingOut(false);
      console.log('About to reset navigation');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      setLoggingOut(false);
      console.error('Logout error:', err);
      if (Platform.OS === 'web') {
        alert('Error: Logout failed. Please try again.');
      } else {
        Alert.alert('Error', 'Logout failed. Please try again.');
      }
    }
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: t.colors.sub }]}>{label}</Text>
      <Text style={[styles.value, { color: t.colors.text }]}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {/* Account Information Card */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Account Information</Text>
        
        <InfoRow label="Name" value={user?.username || user?.name} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Account Number" value={accountNumber || user?.account_number || user?.id} />
      </Card>

      {/* KYC Profile Card */}
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>KYC Profile</Text>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={t.colors.primary} />
            <Text style={[styles.loadingText, { color: t.colors.sub }]}>Loading KYC data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
            <Button
              title="Retry"
              onPress={fetchProfileData}
              style={styles.retryButton}
              variant="ghost"
              color={t.colors.primary}
            />
          </View>
        ) : kycData ? (
          <>
            <InfoRow label="Full Name" value={kycData.full_name || user?.username} />
            <InfoRow label="KYC Level" value={kycData.kyc_level || kycData.level} />
            <InfoRow label="ID Type" value={kycData.id_type} />
            <InfoRow label="ID Number" value={kycData.id_number} />
            <InfoRow label="Expiry Date" value={kycData.expiry_date || kycData.id_expiry} />
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-outline" size={32} color={t.colors.sub} />
            <Text style={[styles.noDataText, { color: t.colors.sub }]}>No KYC data available</Text>
          </View>
        )}
      </Card>

      {/* Logout Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={loggingOut ? "Logging out..." : "Logout"}
          onPress={handleLogout}
          disabled={loggingOut}
          style={styles.logoutButton}
          color="#ef4444"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    marginBottom: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
});