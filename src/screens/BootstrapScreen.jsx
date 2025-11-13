import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeProvider';

export default function BootstrapScreen({ navigation }) {
  const t = useTheme();

  useEffect(() => {
    (async () => {
      try {
        console.log('BootstrapScreen: Checking user accounts...');
        
        // Check if user has existing accounts first
        const { data: accounts } = await api.get('/accounts');
        console.log('BootstrapScreen: User accounts:', accounts);
        
        // If user has accounts, go to Home
        if (accounts && accounts.length > 0) {
          console.log('BootstrapScreen: User has accounts, navigating to Home');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }

        // If no accounts, check for applications
        try {
          const { data: applications } = await api.get('/applications');
          console.log('BootstrapScreen: User applications:', applications);
          
          if (applications && applications.length > 0) {
            const app = applications[0]; // Get the latest application
            
            // Handle different application statuses
            if (app.status === 'draft') {
              navigation.replace('KYC', { applicationId: app.id });
              return;
            } else if (app.status === 'submitted' || app.status === 'in_review') {
              navigation.replace('WaitingReview', { applicationId: app.id });
              return;
            } else if (app.status === 'approved') {
              // Approved but no accounts yet - wait for account creation
              navigation.replace('WaitingReview', { applicationId: app.id });
              return;
            }
          }
        } catch (appError) {
          console.log('BootstrapScreen: No applications found or error:', appError.response?.status);
        }

        // No accounts and no applications - start new application
        console.log('BootstrapScreen: No accounts or applications, starting new application');
        navigation.replace('CreateApplication');
        
      } catch (error) {
        console.error('BootstrapScreen: Error checking accounts:', error.response?.data || error.message);
        // If accounts API fails, still try to start application process
        navigation.replace('CreateApplication');
      }
    })();
  }, [navigation]);

  return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:t.colors.bg }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
