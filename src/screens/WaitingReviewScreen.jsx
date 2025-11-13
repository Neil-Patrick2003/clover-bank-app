import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Button } from '../components/ui';

// Custom Icon/Illustration - using a simple text icon for this environment
const ReviewIcon = ({ color }) => (
  <Text style={{ fontSize: 80, color: color, marginBottom: 20 }}>
    📄
  </Text>
);

export default function WaitingReviewScreen({ navigation, route }) {
  const t = useTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null); 

  const applicationId = route?.params?.applicationId; 

  const checkNow = useCallback(async () => {
    if (isChecking) return; 

    setIsChecking(true);
    try {
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const { data } = await api.get('/applications/status');
      
      if ((data.open_accounts ?? 0) > 0) {
        // Application Approved: Navigate to Home/Dashboard
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        // Status remains the same
        setLastCheckTime(new Date());
      }

    } catch (e) {
      console.error("Failed to check status:", e);
      setLastCheckTime(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [navigation, isChecking]);
  
  // New function to manually navigate to the Dashboard (bypassing the application flow)
  const goToDashboard = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // IMPORTANT FIX: Removed all automatic checks (no checkNow() call in useEffect)
  useEffect(() => {
    // This screen no longer performs any automatic status checks.
    // Cleanup function is empty.
    return () => {};
  }, []); 

  const timeSinceLastCheck = lastCheckTime ? Math.floor((new Date().getTime() - lastCheckTime.getTime()) / 1000) : null;
  
  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      <Card style={[styles.card, { backgroundColor: t.colors.surface ?? '#FFFFFF' }]}>
        
        <View style={styles.iconContainer}>
          <ReviewIcon color={t.colors.primary ?? '#2563eb'} />
        </View>

        <Text style={[styles.title, { color: t.colors.text }]}>
          Application Submitted
        </Text>
        
        <Text style={[styles.subtitle, { color: t.colors.sub }]}>
          Thank you for your application. We are currently reviewing your details. 
          Use the button below to check the status.
        </Text>

        {applicationId && (
            <Text style={[styles.appIdText, { color: t.colors.placeholder }]}>
                Reference ID: {applicationId}
            </Text>
        )}

        <View style={styles.separator} />
        
        {/* 1. PRIMARY BUTTON: Refresh/Check Status */}
        <Pressable 
            onPress={checkNow} 
            disabled={isChecking}
            style={({ pressed }) => [
                styles.refreshButton,
                { 
                    backgroundColor: t.colors.primary,
                    opacity: pressed || isChecking ? 0.7 : 1,
                }
            ]}
        >
            {isChecking ? (
                <ActivityIndicator color={t.colors.onPrimary ?? '#FFFFFF'} size="small" />
            ) : (
                <Text style={[styles.refreshButtonText, { color: t.colors.onPrimary ?? '#FFFFFF' }]}>
                    Check Status Now
                </Text>
            )}
        </Pressable>

        <View style={styles.pollingStatus}>
            <Text style={[styles.pollingText, { color: t.colors.sub }]}>
                {isChecking 
                    ? 'Checking status...' 
                    : lastCheckTime 
                        ? `Last check: ${timeSinceLastCheck}s ago` 
                        : 'Press "Check Status Now" to refresh.'}
            </Text>
        </View>
        
        {/* 2. SECONDARY BUTTON: Go to Dashboard Override */}
        <Pressable 
            onPress={goToDashboard} 
            style={styles.secondaryButton}
        >
            <Text style={[styles.secondaryButtonText, { color: t.colors.primary }]}>
                Go to Dashboard
            </Text>
        </Pressable>

      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  card: { 
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginTop: 10,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 15,
    marginTop: 10, 
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  appIdText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
  },
  separator: {
    height: 1,
    width: '80%',
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  refreshButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pollingStatus: {
    marginTop: 15,
    minHeight: 20, 
  },
  pollingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 15,
    padding: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  }
});