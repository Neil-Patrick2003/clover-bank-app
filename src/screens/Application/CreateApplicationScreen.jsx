import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui';

export default function CreateApplicationScreen({ navigation }) {
  const t = useTheme();
  
  const start = async () => {
    try {
        const { data } = await api.post('/applications', {}); 
        navigation.navigate('KYC', { applicationId: data.id });
    } catch (error) {
        console.error("Failed to start application:", error);
        alert("Could not start application. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      
      {/* Header Section - Compact */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: t.colors.primary + '20' }]}>
          <Text style={styles.icon}>🏦</Text>
        </View>
        <Text style={[styles.title, { color: t.colors.text }]}>
          Open Your Account
        </Text>
        <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
          Get started in just 5 minutes
        </Text>
      </View>

      {/* Features Section - Compact */}
      <View style={styles.featuresSection}>
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: t.colors.primary + '20' }]}>
            <Text style={[styles.featureEmoji, { color: t.colors.primary }]}>⚡</Text>
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: t.colors.text }]}>Quick Process</Text>
            <Text style={[styles.featureDesc, { color: t.colors.textSecondary }]}>5-minute application</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: t.colors.primary + '20' }]}>
            <Text style={[styles.featureEmoji, { color: t.colors.primary }]}>🔒</Text>
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: t.colors.text }]}>Secure & Safe</Text>
            <Text style={[styles.featureDesc, { color: t.colors.textSecondary }]}>Bank-level security</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: t.colors.primary + '20' }]}>
            <Text style={[styles.featureEmoji, { color: t.colors.primary }]}>📱</Text>
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: t.colors.text }]}>Mobile Friendly</Text>
            <Text style={[styles.featureDesc, { color: t.colors.textSecondary }]}>Optimized for your device</Text>
          </View>
        </View>
      </View>

      {/* Process Steps - Compact */}
      <View style={styles.processSection}>
        <Text style={[styles.processTitle, { color: t.colors.text }]}>Simple 3-step process:</Text>
        
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: t.colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: t.colors.text }]}>Start Application</Text>
          </View>
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: t.colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: t.colors.text }]}>Complete KYC</Text>
          </View>
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: t.colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: t.colors.text }]}>Choose Banks</Text>
          </View>
        </View>
      </View>

      {/* CTA Section - Compact */}
      <View style={styles.ctaSection}>
        <Button 
          title="Start Application Now" 
          onPress={start} 
          color={t.colors.primary}
          style={styles.button}
        />
        
        <Text style={[styles.securityText, { color: t.colors.textSecondary }]}>
          🔒 Your information is secure and encrypted
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 22
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  processSection: {
    marginBottom: 20,
  },
  processTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  ctaSection: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
  },
});