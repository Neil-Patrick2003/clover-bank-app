import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, TouchableOpacity, Alert, Platform, Modal, ScrollView, Picker } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

const KYC_LEVELS = ['basic', 'standard', 'enhanced'];
const KYC_LEVELS_DISPLAY = ['Basic', 'Standard', 'Enhanced'];
const ID_TYPES = ['passport', 'national_id', 'driver_license', 'sss', 'umid', 'other'];
const ID_TYPES_DISPLAY = ['Passport', 'National ID', 'Driver\'s License', 'SSS', 'UMID', 'Other'];

const DatePickerField = ({ label, value, onValueChange, t }) => {
    const handleDateInputChange = (e) => {
        const inputValue = e.target.value;
        if (inputValue) {
            onValueChange(inputValue);
        }
    };

    return (
        <View style={{ width: '100%' }}>
            <input
                type="date"
                value={value}
                onChange={handleDateInputChange}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    borderWidth: '1px',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderStyle: 'solid',
                    color: 'white',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                }}
                placeholder="YYYY-MM-DD"
            />
        </View>
    );
};

const Select = ({ label, value, options, displayOptions, onValueChange, t }) => {
    const [showPicker, setShowPicker] = useState(false);
    const displayValue = displayOptions[options.indexOf(value)] || value;

    if (Platform.OS === 'web') {
        return (
            <View style={{ width: '100%' }}>
                <select
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        borderWidth: '1.5px',
                        borderColor: value ? t.colors.primary : 'rgba(255, 255, 255, 0.5)',
                        borderStyle: 'solid',
                        color: 'white',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                    }}
                >
                    <option value="" style={{ color: '#333' }}>
                        {label}
                    </option>
                    {options.map((opt, idx) => (
                        <option key={opt} value={opt} style={{ color: '#333' }}>
                            {displayOptions[idx]}
                        </option>
                    ))}
                </select>
            </View>
        );
    }

    // Mobile picker
    return (
        <>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={{ width: '100%' }}>
                <Input
                    placeholder={label}
                    value={displayValue}
                    editable={false}
                    pointerEvents="none"
                    style={{ 
                        borderColor: value ? t.colors.primary : 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                    inputStyle={{ color: 'white' }}
                />
            </TouchableOpacity>
            <Modal
                visible={showPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
            >
                <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                            {label}
                        </Text>
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                            <Text style={{ color: t.colors.primary, fontSize: 16, fontWeight: 'bold' }}>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Picker
                        selectedValue={value}
                        onValueChange={(itemValue) => {
                            onValueChange(itemValue);
                            setShowPicker(false);
                        }}
                        style={{ backgroundColor: '#333', color: 'white' }}
                    >
                        {options.map((opt, idx) => (
                            <Picker.Item key={opt} label={displayOptions[idx]} value={opt} />
                        ))}
                    </Picker>
                </View>
            </Modal>
        </>
    );
};

export default function KycScreen({ route, navigation }) {
  const { applicationId } = route.params; 
  const t = useTheme();

  const [kycLevel, setKycLevel] = useState('basic');
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState(''); 
  const [idExpiry, setIdExpiry] = useState('');
  const [msg, setMsg] = useState('');

const save = async () => {
    setMsg('');
    try {
      await api.post('/applications/kyc', { 
          kyc_level: kycLevel, 
          id_type: idType, 
          id_number: idNumber, 
          id_expiry: idExpiry || null 
      });
      
      navigation.navigate('RequestedAccounts', { applicationId });
    } catch (e) { 
        setMsg('❌ ' + (e?.response?.data?.message || 'Failed to save KYC')); 
    }
};

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
                displayOptions={KYC_LEVELS_DISPLAY}
                onValueChange={setKycLevel}
                t={t}
            />

            {/* Select for ID Type */}
            <Select
                label="Select ID Type"
                value={idType}
                options={ID_TYPES}
                displayOptions={ID_TYPES_DISPLAY}
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
            
            {/* Date Picker for ID Expiry */}
            <DatePickerField
                label="ID Expiry"
                value={idExpiry}
                onValueChange={setIdExpiry}
                t={t}
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
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
});