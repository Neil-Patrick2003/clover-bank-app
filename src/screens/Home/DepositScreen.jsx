// src/screens/Home/DepositScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Input, Button } from '../../components/ui';

// Helper to format money (kept as is)
const formatMoney = (amt, cur) => {
  const n = Number(amt) || 0;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'PHP').toUpperCase() }).format(n); }
  catch { return `${(cur || 'PHP').toUpperCase()} ${n.toFixed(2)}`; }
};

export default function DepositScreen() {
  const t = useTheme();
  // Destructure colors for cleaner access in render
  const { colors } = t;

  // --- State ---
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null); // {id, account_number, currency, balance}
  const [showPicker, setShowPicker] = useState(false);

  const [amount, setAmount]   = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Refined feedback state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  
  const [busy, setBusy]       = useState(false);

  // --- Effects & Memos ---
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/accounts');
        const fetchedAccounts = data ?? [];
        setAccounts(fetchedAccounts);

        // Auto-select the first account if none is selected
        if (fetchedAccounts.length > 0 && !selected) {
          setSelected(fetchedAccounts[0]); 
        }
      } catch (e) {
        setErrorMsg('Failed to load accounts.');
      }
    })();
  }, []);

  const isAmountValid = useMemo(() => {
    // Cleaner parsing and validation
    const n = parseFloat(amount);
    return !Number.isNaN(n) && n > 0;
  }, [amount]);

  const canSubmit = !!selected && isAmountValid && !busy;
  
  // --- Input Handlers ---
  const handleAmountChange = useCallback((text) => {
    // Strict Input Formatting: Allows only numbers and one decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    const parts = cleanedText.split('.');
    
    // Ensure only one decimal point is present
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(cleanedText);
    }
    // Clear previous feedback on input change
    setSuccessMsg('');
    setErrorMsg('');
  }, []);

  // --- Functions ---
  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSuccessMsg(''); setErrorMsg(''); setBusy(true);
    
    const depositAmount = parseFloat(amount);
    
    try {
      const { data } = await api.post('/deposits', {
        account_id: Number(selected.id),
        amount: depositAmount,
        remarks: remarks || undefined,
      });
      
      setSuccessMsg(`Deposit successful! New Balance: ${formatMoney(data.new_balance, selected.currency)} • Ref: ${data.reference_no}`);
      setAmount(''); setRemarks('');
      
      // Refresh selected account balance locally
      const { data: freshAccounts } = await api.get('/accounts');
      setAccounts(freshAccounts ?? []);
      const updated = (freshAccounts ?? []).find(a => String(a.id) === String(selected.id));
      if (updated) setSelected(updated);
      
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [canSubmit, selected, amount, remarks]); 

  // --- Render ---
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} 
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16 }} 
        automaticallyAdjustContentInsets={false} 
        keyboardShouldPersistTaps="handled" 
      >
        <Card style={{ padding:20 ,gap:18 }}>
          <Text style={{ fontWeight:'800', color:colors.text, fontSize:22, alignSelf: 'center' }}>💰 Fund Deposit</Text>
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* --- Account Selector (Visual/UX Enhanced) --- */}
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              borderWidth:1, 
              borderColor: colors.border, 
              backgroundColor: colors.card,
              paddingHorizontal:16, 
              paddingVertical:16, 
              borderRadius:16, 
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 22, marginRight: 12 }}>🏦</Text> 
            
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: selected ? colors.text : colors.sub, 
                fontWeight:'700', 
                fontSize: 16 
              }}>
                {selected
                  ? `${(selected.currency || 'PHP').toUpperCase()} • ${selected.account_number}`
                  : 'Tap to select account'}
              </Text>
              {!!selected && (
                <Text style={{ marginTop:4, color:colors.sub, fontWeight:'600', fontSize: 13 }}>
                  Current Balance: {formatMoney(selected.balance, selected.currency)}
                </Text>
              )}
            </View>
            <Text style={{ color: colors.sub, fontSize: 18, fontWeight: 'bold' }}>&gt;</Text>
          </Pressable>

          {/* --- Amount (Prominent) --- */}
          <Input
            label={`Deposit Amount (${selected?.currency || 'PHP'})`} 
            placeholder="0.00"
            value={amount}
            onChangeText={handleAmountChange} // Use refined handler
            keyboardType="decimal-pad"
            style={{ fontSize: 32, fontWeight: '900', color: colors.text }}
            subText={!selected ? 'Select an account first.' : (isAmountValid ? '' : 'Enter a valid amount.')}
            subTextStyle={{ color: colors.error }}
          />

          {/* --- Quick fill chips --- */}
          {!!selected && (
            <View style={{ flexDirection:'row', flexWrap: 'wrap', marginTop: 5 }}>
              <Text style={{ 
                color: colors.sub, 
                alignSelf: 'center', 
                marginRight: 12, 
                marginBottom: 10,
              }}>Quick Fill:</Text>

              {[100,500,1000,5000].map(v => (
                <Pressable
                  key={v}
                  onPress={() => handleAmountChange(String(v))} // Use unified handler
                  style={({ pressed }) => ({ 
                    paddingHorizontal:12, 
                    paddingVertical:6, 
                    borderRadius:8, // Squarer corners look more modern
                    borderWidth:1, 
                    borderColor:colors.border, 
                    backgroundColor: pressed ? colors.primary + '30' : colors.card,
                    marginRight: 8, 
                    marginBottom: 8, 
                  })}
                >
                  <Text style={{ fontWeight:'700', color:colors.text, fontSize: 13 }}>
                    {formatMoney(v, selected.currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* --- Remarks --- */}
          <Input 
            placeholder="e.g., Cash Deposit, ATM Top-up (Optional)" 
            label="Remarks"
            value={remarks} 
            onChangeText={setRemarks} 
          />

          {/* --- Submit Button --- */}
          <Button 
            title={busy 
              ? 'Processing…' 
              : `Deposit ${isAmountValid && selected ? formatMoney(amount, selected.currency) : 'Funds'}`
            } 
            onPress={submit} 
            disabled={!canSubmit} 
            style={{ marginTop: 10 }}
          />

          {/* --- Feedback --- */}
          {successMsg ? (
            <Text 
              style={{ 
                marginTop: 10, 
                textAlign: 'center',
                color: colors.primary, 
                fontWeight: '700',
              }}
              accessibilityLiveRegion="polite"
            >
              {`✅ ${successMsg}`}
            </Text>
          ) : null}

          {errorMsg ? (
            <Text 
              style={{ 
                marginTop: 10, 
                textAlign: 'center',
                color: colors.error || '#b91c1c', 
                fontWeight: '600',
              }}
              accessibilityLiveRegion="assertive"
            >
              {`❌ ${errorMsg}`}
            </Text>
          ) : null}
        </Card>
        
        {/* Removed inline account list to reduce clutter. The Modal handles selection. */}

      </ScrollView>

      {/* --- Account Picker Modal --- */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        {/* Modal background Pressable to close on tap outside */}
        <Pressable 
            style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' }}
            onPress={() => setShowPicker(false)}
        >
          {/* Prevent taps on the modal content from closing the modal */}
          <Pressable style={{
            backgroundColor:colors.card, 
            borderTopLeftRadius:18, 
            borderTopRightRadius:18, 
            padding:16, 
            maxHeight:'60%'
          }}>
            <Text style={{ fontWeight:'900', fontSize:18, color:colors.text, marginBottom:12 }}>Select Destination Account</Text>
            <FlatList
              data={accounts}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSelected(item); setShowPicker(false); }}
                  style={{ 
                    paddingVertical:14, 
                    backgroundColor: String(item.id) === String(selected?.id) ? colors.primary + '10' : 'transparent',
                    borderRadius: 8,
                    paddingHorizontal: 8, // Added horizontal padding for highlight
                  }}
                >
                  <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                    <Text style={{ fontWeight:'800', color:colors.text, fontSize:15 }}>
                      {item.account_number} • {(item.currency || 'PHP').toUpperCase()}
                    </Text>
                    <Text style={{ color:colors.text, fontWeight:'900' }}>{formatMoney(item.balance, item.currency)}</Text>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border + '50' }} />}
              ListEmptyComponent={<Text style={{ color:colors.sub }}>No accounts found.</Text>}
            />
            <Button title="Done" variant="ghost" style={{ marginTop:16 }} onPress={() => setShowPicker(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}