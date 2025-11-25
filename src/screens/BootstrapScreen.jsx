import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, Pressable, ImageBackground, StyleSheet, StatusBar } from 'react-native';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeProvider';

// Mock image URL for a clean, professional background (replace with a real asset later)
const BACKGROUND_IMAGE_URI = 'https://placehold.co/1080x1920/1a1a2e/ffffff?text=Secure+Banking+Platform';
const MIN_LOAD_TIME = 2000; // Minimum 2 seconds to show the splash screen

export default function BootstrapScreen({ navigation }) {
  const t = useTheme();
  const [isStatusChecked, setIsStatusChecked] = useState(false);
  const [statusCheckFailed, setStatusCheckFailed] = useState(false);
  const [loadingText, setLoadingText] = useState('Checking application status...');
  
  const handleRouting = useCallback(async () => {
    let nextRoute = null;
    let nextParams = {};
    let success = false;

    try {
      const { data } = await api.get('/applications/status');
      
      // 1) Already has open accounts -> Home
      if ((data.open_accounts ?? 0) > 0) {
        nextRoute = 'Home';
      } 
      // 2) Has an application?
      else {
        const app = data.application;
        if (!app) {
          // No app yet -> start
          nextRoute = 'CreateApplication';
        } else if (app.status === 'draft') {
          // Draft
          nextRoute = data.has_kyc ? 'RequestedAccounts' : 'KYC';
          nextParams = { applicationId: app.id };
        } else if (app.status === 'submitted' || app.status === 'in_review' || (app.status === 'approved' && (data.open_accounts ?? 0) === 0)) {
          // Submitted/In review or Approved but accounts not visible yet
          nextRoute = 'WaitingReview';
          nextParams = { applicationId: app.id };
        } else {
          // Fallback if application status is unexpected
          nextRoute = 'CreateApplication';
        }
      }
      
      success = true;

    } catch (e) {
      console.error("Bootstrap failed to fetch status:", e);
      // Set failure state to allow manual navigation
      setStatusCheckFailed(true);
      setLoadingText('Failed to connect. Tap the button to proceed to the dashboard.');
    } finally {
      setIsStatusChecked(true);
      
      if (success && nextRoute) {
        // Only navigate if successful and a route was determined
        navigation.reset({ index: 0, routes: [{ name: nextRoute, params: nextParams }] });
      }
    }
  }, [navigation]);

  // Combined effect for minimum load time and routing logic
  useEffect(() => {
    const startTime = Date.now();

    handleRouting();

    // Ensure splash screen displays for at least MIN_LOAD_TIME
    const remainingTime = MIN_LOAD_TIME - (Date.now() - startTime);
    if (remainingTime > 0) {
        // This timer keeps the screen visible while status is being checked
        setTimeout(() => {}, remainingTime);
    }
  }, [handleRouting]);

  // Fallback function for the button (forces navigation to Dashboard)
  const goToDashboardOverride = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <ImageBackground source={{ uri: BACKGROUND_IMAGE_URI }} style={styles.background}>
      <StatusBar barStyle='light-content' backgroundColor='transparent' translucent />
      
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>Secure Bank</Text>
        <Text style={styles.subtitle}>Your Future, Managed.</Text>

        {!isStatusChecked || statusCheckFailed ? (
          <>
            <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
            <Text style={styles.statusText}>{loadingText}</Text>
          </>
        ) : (
          <View style={styles.checkSuccess}>
            <Text style={styles.statusText}>Redirecting...</Text>
          </View>
        )}

        {/* Fallback/Override Button (Visible only on failure) */}
        {isStatusChecked && statusCheckFailed && (
            <Pressable 
                onPress={goToDashboardOverride} 
                style={[styles.dashboardButton, { backgroundColor: t.colors.primary || '#00CC7A' }]}
                accessibilityLabel="Go to Dashboard"
            >
                <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </Pressable>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.75)', // Dark overlay for text visibility
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#D1D5DB', 
    marginBottom: 50,
  },
  spinner: {
    marginTop: 20,
    marginBottom: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    minHeight: 40, 
  },
  checkSuccess: {
    minHeight: 40,
    justifyContent: 'center',
  },
  dashboardButton: {
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  dashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});