import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

// You'll need an actual image file. Use the path you set up.
const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

// --- DUMMY SELECTOR OPTIONS ---
const KYC_LEVELS = ['Basic', 'Standard', 'Enhanced'];
const ID_TYPES = ['Passport', 'National ID', 'Driver\'s License'];

// --- CUSTOM SELECT COMPONENT (SIMULATED) ---
// This assumes your custom UI library provides a <Select> component 
// that renders a dropdown/picker styled like an Input component.
const Select = ({ label, value, options, onValueChange, t }) => {
    // NOTE: In your production code, this component should internally render 
    // a dropdown or picker modal using the provided `options` and calling 
    // `onValueChange` with the new selection.
    
    // We keep the Alert mock here for functional demonstration:
    const handlePress = () => {
        Alert.alert(
            label,
            "Select an option:",
            options.map(opt => ({
                text: opt,
                onPress: () => onValueChange(opt),
            }))
        );
    };

    return (
        <TouchableOpacity onPress={handlePress} style={{ width: '100%' }}>
            {/* The visual appearance mimics the glass input style */}
            <Input
                placeholder={label}
                value={value}
                editable={false}
                pointerEvents="none"
                style={{ 
                    borderColor: value ? t.colors.primary : 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
                inputStyle={{ color: 'white' }}
                // You might need to add a dropdown icon here for better UX
            />
        </TouchableOpacity>
    );
};


export default function KycScreen({ route, navigation }) {
  const { applicationId } = route.params; 
  const t = useTheme();

  const [kycLevel, setKycLevel] = useState('Basic');
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState(''); 
  const [idExpiry, setIdExpiry] = useState('');
  const [msg, setMsg] = useState('');

  // In KycScreen.js, update the save function:

const save = async () => {
    setMsg('');
    try {
      
      // 1. Standardize and simplify the id_type value to match the ENUM
      const apiIdType = idType.toLowerCase()
        // Replace 'driver's license' with the exact ENUM value 'driver_license'
        .replace("driver's license", 'driver_license') 
        // Remove apostrophes, then replace remaining spaces with underscores
        .replace(/[']/g, '') // Remove apostrophes globally (just in case)
        .replace(/\s/g, '_'); 

      await api.post('/applications/kyc', { 
          // Ensure kyc_level is also lowercase
          kyc_level: kycLevel.toLowerCase(), 
          id_type: apiIdType, // <-- Now this matches 'driver_license'
          id_number: idNumber, 
          id_expiry: idExpiry || null 
      });
      
      navigation.navigate('RequestedAccounts', { applicationId });
    } catch (e) { 
        // Display the actual error message received from the API
        setMsg('❌ ' + (e?.response?.data?.message || 'Failed to save KYC')); 
    }
};

// Also, verify your selection options match the user-friendly format:
const ID_TYPES = ['Passport', 'National ID', 'Driver\'s License'];

  return (
    <ImageBackground 
      source={BACKGROUND_IMAGE} 
      style={styles.imageBackground}
      resizeMode="cover" 
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.contentWrapper}>
          
          {/* --- GLASSMORHISM CARD --- */}
          <Card style={[styles.glassCard, { gap: 15 }]}> 
            
            {/* Header Block */}
            <Text style={styles.subHeader}>STEP 1 OF 3</Text>
            <Text style={styles.header}>
                Verify Your Identity (KYC)
            </Text>
            
            {/* Status Message */}
            {msg ? <Text style={styles.errorText}>{msg}</Text> : null}

            {/* Select for KYC Level */}
            <Select
                label="Select KYC Level"
                value={kycLevel}
                options={KYC_LEVELS}
                onValueChange={setKycLevel}
                t={t}
            />

            {/* Select for ID Type */}
            <Select
                label="Select ID Type"
                value={idType}
                options={ID_TYPES}
                onValueChange={setIdType}
                t={t}
            />

            {/* Standard Input for ID Number */}
            <Input 
                placeholder="ID Number" 
                value={idNumber} 
                onChangeText={setIdNumber} 
                style={styles.glassInput}
                inputStyle={styles.glassInputText}
                keyboardType="default"
            />
            
            {/* Standard Input for ID Expiry */}
            <Input 
                placeholder="ID Expiry (YYYY-MM-DD, optional)" 
                value={idExpiry} 
                onChangeText={setIdExpiry} 
                style={styles.glassInput}
                inputStyle={styles.glassInputText}
                keyboardType="numeric"
            />

            {/* Continue Button */}
            <Button 
                title="Continue" 
                onPress={save} 
                color={t.colors.primary} 
                textStyle={{ color: 'white', fontWeight: 'bold' }} 
                style={{ marginTop: 10 }} 
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
    zIndex: 1, 
  },
  // --- GLASSMORHISM CARD STYLES ---
  glassCard: {
    width: '100%',
    maxWidth: 400,
    padding: 30, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)', 
    shadowColor: 'rgba(0, 0, 0, 0.2)', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  // --- TEXT STYLES (Optimized for Contrast) ---
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#90EE90', 
    marginBottom: 5,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    color: 'white', 
  },
  errorText: {
    color: '#FF6347', 
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  // --- INPUT STYLES (Used by Input fields) ---
  glassInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
  },
  glassInputText: {
    color: 'white',
  }
});