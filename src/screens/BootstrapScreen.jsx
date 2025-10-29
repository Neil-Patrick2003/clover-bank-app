import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeProvider';

export default function BootstrapScreen({ navigation }) {
  const t = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/applications/status');

        // 1) Already has open accounts -> Home
        if ((data.open_accounts ?? 0) > 0) {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }

        // 2) Has an application?
        const app = data.application;
        if (!app) {
          // No app yet -> start
          navigation.replace('CreateApplication');
          return;
        }

        // 2a) Draft
        if (app.status === 'draft') {
          if (data.has_kyc) {
            // Skip KYC if already present
            navigation.replace('RequestedAccounts', { applicationId: app.id });
          } else {
            navigation.replace('KYC', { applicationId: app.id });
          }
          return;
        }

        // 2b) Submitted/In review
        if (app.status === 'submitted' || app.status === 'in_review') {
          navigation.replace('WaitingReview', { applicationId: app.id });
          return;
        }

        // 2c) Approved but no accounts yet (race) -> poll via WaitingReview
        if (app.status === 'approved' && (data.open_accounts ?? 0) === 0) {
          navigation.replace('WaitingReview', { applicationId: app.id });
          return;
        }

        // Fallback
        navigation.replace('CreateApplication');
      } catch {
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
