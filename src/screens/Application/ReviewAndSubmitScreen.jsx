import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, ScrollView, Alert } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

export default function ReviewAndSubmitScreen({ route, navigation }) {
  const { applicationId } = route.params; 
  const t = useTheme();

  const [app, setApp] = useState(null); 
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => { 
    try {
        const { data } = await api.get(`/applications/${applicationId}`);
        setApp(data); 
    } catch (e) {
        console.error("Failed to load application data:", e);
        // Note: Removed Alert to keep logic simpler, matching the original file's minimalism
    }
  };
  
  useEffect(() => { load(); }, [applicationId]);

  const submit = async () => {
    setIsLoading(true);
    setMsg(''); 
    try {
      await api.post(`/applications/${applicationId}/submit`);
      
      setMsg('✅ Submitted. We’ll notify you after review.'); 
      setTimeout(() => navigation.replace('Home'), 700);
    } catch (e) { 
      setMsg('❌ ' + (e?.response?.data?.message || 'Submit failed')); 
      setIsLoading(false);
    }
  };

  if (!app) return null;

  const accounts = app.requested_accounts || [];
  const isDraft = app.status === 'draft';
  const submitDisabled = isLoading || !isDraft;

  return (
    <ImageBackground 
      source={BACKGROUND_IMAGE} 
      style={styles.imageBackground}
      resizeMode="cover" 
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={styles.contentWrapper}>
          <Card style={[styles.glassCard, { gap: 16, padding: 24 }]}> 
            
            <Text style={styles.subHeader}>STEP 3 OF 3</Text>
            <Text style={styles.header}>
                Review & Submit
            </Text>

            {/* --- APPLICATION STATUS/INFO --- */}
            <View style={styles.infoBlock}>
                <Text style={styles.infoTitle}>Application Status</Text>
                <Text style={[styles.infoValue, { color: isDraft ? '#FFD700' : '#90EE90' }]}>
                    {app.status.toUpperCase()}
                </Text>
            </View>

            {/* --- REQUESTED ACCOUNTS SUMMARY --- */}
            <View style={styles.infoBlock}>
                <Text style={styles.infoTitle}>Requested Accounts ({accounts.length})</Text>
                {accounts.length > 0 ? (
                    accounts.map((r, index) => {
                        // DEFENSIVE CHECK: Ensure 'r' exists before accessing properties
                        if (!r) return null; 
                        
                        return (
                            <View key={index} style={styles.accountItem}>
                                <Text style={styles.accountText}>
                                    {/* Defensive call to toUpperCase() with fallback */}
                                    • **{((r.requested_type ?? 'N/A')).toUpperCase().replace(/_/g, ' ')}**
                                </Text>
                                <Text style={styles.accountText}>
                                    {r.currency ?? 'N/A'} {Number(r.initial_deposit ?? 0).toFixed(2)}
                                </Text>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.emptyListText}>No accounts found.</Text>
                )}
            </View>

            {/* --- MESSAGE / FEEDBACK --- */}
            {msg ? (
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{msg}</Text>
                </View>
            ) : null}

            {/* --- SUBMIT BUTTON --- */}
            <Button 
                title={isLoading ? "Submitting..." : "Submit Application"} 
                onPress={submit}
                disabled={submitDisabled}
                color={submitDisabled ? t.colors.disabled : t.colors.primary} 
                textStyle={{ color: 'white', fontWeight: 'bold' }} 
            />
            {!isDraft && (
                <Text style={styles.disabledText}>
                    Only applications in draft state can be submitted.
                </Text>
            )}
            
          </Card>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollWrapper: {
      flexGrow: 1,
      justifyContent: 'center',
  },
  contentWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, 
  },
  // --- GLASSMORHISM CARD STYLES ---
  glassCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)', 
    shadowColor: 'rgba(0, 0, 0, 0.2)', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  // --- HEADER & TEXT STYLES ---
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#90EE90', // Green accent
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    color: 'white', 
  },
  // --- INFO BLOCKS ---
  infoBlock: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      gap: 5,
  },
  infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      paddingBottom: 5,
      marginBottom: 5,
  },
  infoValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
  },
  // --- ACCOUNT LIST ---
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  },
  emptyListText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  // --- MESSAGE BOX ---
  messageBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  messageText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  disabledText: {
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      fontSize: 12,
  }
});