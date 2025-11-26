import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';

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
    
    const confirmLogout = () => {
      // Use window.confirm for web, Alert.alert for mobile
      if (Platform.OS === 'web') {
        return window.confirm('Are you sure you want to logout?');
      } else {
        // For mobile, we'll handle this differently
        return true;
      }
    };

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
      if (confirmLogout()) {
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <View style={[styles.section, { borderBottomColor: t.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: t.colors.sub }]}>Name</Text>
          <Text style={[styles.value, { color: t.colors.text }]}>{user?.username || user?.name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: t.colors.sub }]}>Email</Text>
          <Text style={[styles.value, { color: t.colors.text }]}>{user?.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: t.colors.sub }]}>Account Number</Text>
          <Text style={[styles.value, { color: t.colors.text }]}>{accountNumber || user?.account_number || user?.id || 'N/A'}</Text>
        </View>
      </View>

      <View style={[styles.section, { borderBottomColor: t.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>KYC Profile</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
            <Pressable
              onPress={fetchProfileData}
              style={[styles.retryButton, { backgroundColor: t.colors.primary }]}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : kycData ? (
          <>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: t.colors.sub }]}>Full Name</Text>
              <Text style={[styles.value, { color: t.colors.text }]}>{kycData.full_name || user?.username || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: t.colors.sub }]}>KYC Level</Text>
              <Text style={[styles.value, { color: t.colors.text }]}>{kycData.kyc_level || kycData.level || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: t.colors.sub }]}>ID Type</Text>
              <Text style={[styles.value, { color: t.colors.text }]}>{kycData.id_type || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: t.colors.sub }]}>ID Number</Text>
              <Text style={[styles.value, { color: t.colors.text }]}>{kycData.id_number || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: t.colors.sub }]}>Expiry Date</Text>
              <Text style={[styles.value, { color: t.colors.text }]}>{kycData.expiry_date || kycData.id_expiry || 'N/A'}</Text>
            </View>
          </>
        ) : (
          <Text style={[styles.noDataText, { color: t.colors.sub }]}>No KYC data available</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={() => {
            console.log('Logout Pressable tapped!');
            handleLogout();
          }}
          disabled={loggingOut}
          style={({ pressed }) => [styles.logoutButton, { backgroundColor: pressed || loggingOut ? '#cccccc' : '#ef4444', opacity: pressed ? 0.7 : 1 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {loggingOut ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </Pressable>
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
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
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
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});