import React from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

// You'll need an actual image file. Use the path you set up.
const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

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
    <ImageBackground 
      source={BACKGROUND_IMAGE} 
      style={styles.imageBackground}
      resizeMode="cover" 
    >
      {/* Set status bar style for contrast against the background image */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Centered Content Wrapper */}
      <View style={styles.contentWrapper}>
          
          {/* --- SIMULATED GLASSMORHISM CARD --- */}
          {/* Using styles defined in the StyleSheet for clean code */}
          <Card style={[styles.glassCard, { gap: 20 }]}> 
            
            {/* Title Block */}
            <Text style={styles.subHeader}>NEW APPLICATION</Text>
            <Text style={styles.header}>
                Open Your Account Today
            </Text>
            
            {/* Descriptive Text */}
            <Text style={styles.bodyText}>
                We're excited to have you! This process will guide you through collecting your necessary KYC (Know Your Customer) details and selecting the bank accounts you wish to open.
            </Text>
            <Text style={[styles.bodyText, { marginTop: -5 }]}>
                The application should take less than 5 minutes.
            </Text>

            {/* Primary Action Button (Green Focus) */}
            <Button 
                title="Start Application" 
                onPress={start} 
                color={t.colors.primary} // Use theme primary color for the button fill
                // Ensure the button text is bright white for contrast
                textStyle={{ color: 'white', fontWeight: 'bold' }} 
                style={{ marginTop: 15 }} 
            />
            
          </Card>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure content is on top
  },
  // --- GLASSMORHISM STYLES ---
  glassCard: {
    width: '100%',
    maxWidth: 400,
    padding: 30, 
    borderRadius: 12, 
    // Glass Effect: Semi-transparent white background
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    
    // Border for the "frosted" edge look
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)', 
    
    // Subtle shadow for lift and depth
    shadowColor: 'rgba(0, 0, 0, 0.2)', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  // --- TEXT STYLES (Optimized for Contrast on Dark/Blurred Background) ---
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#90EE90', // Lighter green for sharp contrast
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    color: 'white', // Ensure high contrast
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.85)', // Slightly translucent white for body
  },
});