import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, TouchableOpacity, Alert, Platform, Modal, ScrollView, FlatList } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

const KYC_LEVELS = ['basic', 'standard', 'enhanced'];
const KYC_LEVELS_DISPLAY = ['Basic', 'Standard', 'Enhanced'];
const ID_TYPES = ['passport', 'national_id', 'driver_license', 'sss', 'umid', 'other'];
const ID_TYPES_DISPLAY = ['Passport', 'National ID', 'Driver\'s License', 'SSS', 'UMID', 'Other'];

const DatePickerField = ({ label, value, onValueChange, t }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [year, setYear] = useState(value ? value.split('-')[0] : new Date().getFullYear().toString());
    const [month, setMonth] = useState(value ? value.split('-')[1] : '01');
    const [day, setDay] = useState(value ? value.split('-')[2] : '01');

    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 100; i <= currentYear + 10; i++) {
            years.push(i.toString());
        }
        return years;
    };

    const generateMonths = () => {
        return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    };

    const generateDays = () => {
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i.toString().padStart(2, '0'));
        }
        return days;
    };

    const handleDateConfirm = () => {
        const formattedDate = `${year}-${month}-${day}`;
        onValueChange(formattedDate);
        setShowDatePicker(false);
    };

    const displayDate = value || 'YYYY-MM-DD';

    if (Platform.OS === 'web') {
        return (
            <View style={{ width: '100%' }}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ width: '100%' }}>
                    <Input
                        placeholder="YYYY-MM-DD"
                        value={displayDate}
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
                    visible={showDatePicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                                Select Date
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Year</Text>
                                    <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8 }}>
                                        {generateYears().map((y) => (
                                            <TouchableOpacity
                                                key={y}
                                                onPress={() => setYear(y)}
                                                style={{ padding: 10, backgroundColor: y === year ? 'rgba(144, 238, 144, 0.3)' : 'transparent' }}
                                            >
                                                <Text style={{ color: y === year ? '#90EE90' : 'white', fontSize: 14, fontWeight: y === year ? 'bold' : 'normal' }}>
                                                    {y}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Month</Text>
                                    <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8 }}>
                                        {generateMonths().map((m) => (
                                            <TouchableOpacity
                                                key={m}
                                                onPress={() => setMonth(m)}
                                                style={{ padding: 10, backgroundColor: m === month ? 'rgba(144, 238, 144, 0.3)' : 'transparent' }}
                                            >
                                                <Text style={{ color: m === month ? '#90EE90' : 'white', fontSize: 14, fontWeight: m === month ? 'bold' : 'normal' }}>
                                                    {m}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Day</Text>
                                    <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 8 }}>
                                        {generateDays().map((d) => (
                                            <TouchableOpacity
                                                key={d}
                                                onPress={() => setDay(d)}
                                                style={{ padding: 10, backgroundColor: d === day ? 'rgba(144, 238, 144, 0.3)' : 'transparent' }}
                                            >
                                                <Text style={{ color: d === day ? '#90EE90' : 'white', fontSize: 14, fontWeight: d === day ? 'bold' : 'normal' }}>
                                                    {d}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleDateConfirm} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: t.colors.primary }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // Mobile version
    return (
        <>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ width: '100%' }}>
                <Input
                    placeholder="YYYY-MM-DD"
                    value={displayDate}
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
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.pickerContainer}>
                    <View style={styles.pickerHeader}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                            Select Date
                        </Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={{ color: t.colors.primary, fontSize: 16, fontWeight: 'bold' }}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 20 }}>
                        <View style={{ flex: 1, marginHorizontal: 5 }}>
                            <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Year</Text>
                            <FlatList
                                data={generateYears()}
                                keyExtractor={(item) => item}
                                renderItem={({ item: y }) => (
                                    <TouchableOpacity
                                        onPress={() => setYear(y)}
                                        style={{ paddingVertical: 10, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: y === year ? 'rgba(144, 238, 144, 0.2)' : 'transparent' }}
                                    >
                                        <Text style={{ color: y === year ? '#90EE90' : 'white', fontSize: 14, fontWeight: y === year ? 'bold' : 'normal', textAlign: 'center' }}>
                                            {y}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                            />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 5 }}>
                            <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Month</Text>
                            <FlatList
                                data={generateMonths()}
                                keyExtractor={(item) => item}
                                renderItem={({ item: m }) => (
                                    <TouchableOpacity
                                        onPress={() => setMonth(m)}
                                        style={{ paddingVertical: 10, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: m === month ? 'rgba(144, 238, 144, 0.2)' : 'transparent' }}
                                    >
                                        <Text style={{ color: m === month ? '#90EE90' : 'white', fontSize: 14, fontWeight: m === month ? 'bold' : 'normal', textAlign: 'center' }}>
                                            {m}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                            />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 5 }}>
                            <Text style={{ color: '#90EE90', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Day</Text>
                            <FlatList
                                data={generateDays()}
                                keyExtractor={(item) => item}
                                renderItem={({ item: d }) => (
                                    <TouchableOpacity
                                        onPress={() => setDay(d)}
                                        style={{ paddingVertical: 10, paddingHorizontal: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: d === day ? 'rgba(144, 238, 144, 0.2)' : 'transparent' }}
                                    >
                                        <Text style={{ color: d === day ? '#90EE90' : 'white', fontSize: 14, fontWeight: d === day ? 'bold' : 'normal', textAlign: 'center' }}>
                                            {d}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                nestedScrollEnabled={true}
                                scrollEnabled={true}
                            />
                        </View>
                    </View>
                    <View style={{ paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(0, 0, 0, 0.9)', flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDateConfirm} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, backgroundColor: t.colors.primary }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const Select = ({ label, value, options, displayOptions, onValueChange, t }) => {
    const [showPicker, setShowPicker] = useState(false);
    const displayValue = displayOptions[options.indexOf(value)] || value;

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
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10, width: '80%', maxWidth: 300, maxHeight: 400 }}>
                        <ScrollView nestedScrollEnabled={true}>
                            {options.map((opt, idx) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => {
                                        onValueChange(opt);
                                        setShowPicker(false);
                                    }}
                                    style={{
                                        padding: 12,
                                        borderBottomWidth: 1,
                                        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                                        backgroundColor: opt === value ? 'rgba(144, 238, 144, 0.3)' : 'transparent',
                                    }}
                                >
                                    <Text style={{ color: opt === value ? '#90EE90' : 'white', fontSize: 14, fontWeight: opt === value ? 'bold' : 'normal' }}>
                                        {displayOptions[idx]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
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