import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, FlatList, Alert, TouchableOpacity, ScrollView, Platform, Modal, Picker } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

const BACKGROUND_IMAGE = require('../../../assets/background_image.png'); 

// --- SELECTOR OPTIONS (Database values and display names) ---
const ACCOUNT_TYPES = ['savings', 'current', 'time_deposit'];
const ACCOUNT_TYPES_DISPLAY = ['Savings', 'Current', 'Time Deposit'];
const CURRENCIES = ['PHP', 'USD', 'EUR'];

// --- CUSTOM SELECT COMPONENT (Web & Mobile) ---
const Select = ({ label, value, options, displayOptions, onValueChange, t }) => {
    const [showPicker, setShowPicker] = useState(false);
    const displayValue = displayOptions ? displayOptions[options.indexOf(value)] || value : value;

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
                            {displayOptions ? displayOptions[idx] : opt}
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
                            <Picker.Item key={opt} label={displayOptions ? displayOptions[idx] : opt} value={opt} />
                        ))}
                    </Picker>
                </View>
            </Modal>
        </>
    );
};


export default function RequestedAccountsScreen({ route, navigation }) {
  const { applicationId } = route.params; 
  const t = useTheme();

  // Initialize state with database values
  const [type, setType] = useState('savings'); 
  const [currency, setCurrency] = useState('PHP');
  const [initial, setInitial] = useState('');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Data Loading (Persists to Backend on Add) ---
  const load = async () => {
    try {
        const { data } = await api.get(`/applications/${applicationId}`);
        setItems(data.requested_accounts || []);
    } catch (e) {
        console.error("Failed to load accounts:", e);
    }
  };
  useEffect(() => { load(); }, [applicationId]);

  const add = async () => {
    if (!type || !currency) {
        Alert.alert("Missing Information", "Please select an account type and currency.");
        return;
    }
    setIsLoading(true);
    
    try {
        await api.post(`/applications/${applicationId}/accounts`, { 
            requested_type: type, 
            currency, 
            initial_deposit: Number(initial || 0) 
        });
        setInitial(''); 
        await load(); // Reloads the new list from the backend
    } catch (e) {
        Alert.alert("Error", "Failed to add account. Please check the deposit amount.");
    } finally {
        setIsLoading(false);
    }
  };
  
  // Validation Check
  const canSubmit = items.length > 0;
  
  const handleReviewAndSubmit = () => {
      if (!canSubmit) {
          Alert.alert("Cannot Proceed", "You must add at least one account request before reviewing and submitting.");
          return;
      }
      navigation.navigate('ReviewAndSubmit', { applicationId });
  };


  return (
    <ImageBackground 
      source={BACKGROUND_IMAGE} 
      style={styles.imageBackground}
      resizeMode="cover" 
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={styles.contentWrapper}>
          <Card style={[styles.glassCard, { gap: 12 }]}> 
            
            <Text style={styles.subHeader}>STEP 2 OF 3</Text>
            <Text style={styles.header}>
                Request Accounts
            </Text>

            {/* --- ADD NEW ACCOUNT FORM --- */}
            <View style={styles.addForm}>
                <Text style={styles.formTitle}>Add Account Request:</Text>
                
                <Select
                    label="Account Type"
                    value={type}
                    options={ACCOUNT_TYPES}
                    displayOptions={ACCOUNT_TYPES_DISPLAY}
                    onValueChange={setType}
                    t={t}
                />

                <Select
                    label="Currency"
                    value={currency}
                    options={CURRENCIES}
                    onValueChange={setCurrency}
                    t={t}
                />
                
                <Input 
                    placeholder="Initial deposit amount (optional)" 
                    value={initial} 
                    onChangeText={setInitial} 
                    keyboardType="decimal-pad"
                />
                
                <Button 
                    title={isLoading ? "Adding..." : `Add ${type} Account`} 
                    onPress={add} 
                    disabled={isLoading}
                    textStyle={{ color: 'white' }}
                />
            </View>

            {/* --- LIST OF REQUESTED ACCOUNTS --- */}
            <View style={styles.listContainer}>
                <FlatList
                style={styles.list}
                data={items}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                    <View style={styles.listItem}>
                    <Text style={styles.listItemText}>
                        • **{item.requested_type.toUpperCase().replace(/_/g, ' ')}** Account
                    </Text>
                    <Text style={styles.listItemSubText}>
                        {item.currency} {Number(item.initial_deposit).toFixed(2)}
                    </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyListText}>No accounts added yet.</Text>
                }
                />
            </View>

            {/* --- SUBMIT BUTTON --- */}
            <Button 
                title="Review & Submit" 
                onPress={handleReviewAndSubmit}
                disabled={!canSubmit} // Disabled if items.length is 0
                color={!canSubmit ? t.colors.disabled : t.colors.textSecondary || '#333'} 
                textStyle={{ color: 'white', fontWeight: 'bold' }} 
            />
            {!canSubmit && (
                <Text style={styles.disabledText}>
                    Please add at least one account to proceed.
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
  // --- FORM & LIST STYLES ---
  addForm: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
    gap: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 5,
  },
  listContainer: {
    maxHeight: 180, // Set max height for scrollable list container
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  list: {
    // FlatList uses its container for height limits
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  listItemText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  listItemSubText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 15,
  },
  emptyListText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
  }
});