// src/screens/Home/DepositScreen.js
import React, { useEffect, useMemo, useState } from 'react';
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

  // --- State ---
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null); // {id, account_number, currency, balance}
  const [showPicker, setShowPicker] = useState(false);

  const [amount, setAmount]   = useState('');
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg]         = useState('');
  const [busy, setBusy]       = useState(false);

  // --- Effects & Memos ---
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/accounts');
      setAccounts(data ?? []);
      if ((data ?? []).length === 1) setSelected(data[0]); 
    })();
  }, []);

  const isAmountValid = useMemo(() => {
    const n = Number(amount);
    return !Number.isNaN(n) && n > 0;
  }, [amount]);

  const canSubmit = !!selected && isAmountValid && !busy;

  // --- Functions ---
  const submit = async () => {
    if (!canSubmit) return;
    setMsg(''); setBusy(true);
    try {
      const { data } = await api.post('/deposits', {
        account_id: Number(selected.id),
        amount: Number(amount),
        remarks: remarks || undefined,
      });
      setMsg(`✅ Deposited. New balance: ${Number(data.new_balance).toFixed(2)} • Ref: ${data.reference_no}`);
      setAmount(''); setRemarks('');
      
      // refresh selected account balance locally
      const fresh = await api.get('/accounts');
      setAccounts(fresh.data ?? []);
      const updated = (fresh.data ?? []).find(a => String(a.id) === String(selected.id));
      if (updated) setSelected(updated);
    } catch (e) {
      setMsg('❌ ' + (e?.response?.data?.message || 'Failed to post deposit'));
    } finally {
      setBusy(false);
    }
  };

  // --- Render ---
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} 
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16 }} 
        automaticallyAdjustContentInsets={false} 
      >
        <Card style={{ gap:18 }}>
          <Text style={{ fontWeight:'800', color:t.colors.text, fontSize:20 }}>💰 Deposit Funds</Text>

          {/* --- Account Selector (Improved Design) --- */}
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              borderWidth:1, 
              borderColor: t.colors.border, 
              backgroundColor: t.colors.card,
              paddingHorizontal:16, 
              paddingVertical:14, 
              borderRadius:16, 
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: selected ? t.colors.text : t.colors.sub, fontWeight:'700', fontSize: 16 }}>
                {selected
                  ? `${(selected.currency || 'PHP').toUpperCase()} • ${selected.account_number}`
                  : 'Select destination account'}
              </Text>
              {!!selected && (
                <Text style={{ marginTop:4, color:t.colors.text, fontWeight:'900' }}>
                  Current Balance: {formatMoney(selected.balance, selected.currency)}
                </Text>
              )}
            </View>
            <Text style={{ color: t.colors.sub, fontSize: 18, fontWeight: 'bold' }}>&gt;</Text>
          </Pressable>

          {/* --- Amount (More Prominent) --- */}
          <Input
            label={`Amount (${selected?.currency || 'PHP'})`} 
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{ fontSize: 28, fontWeight: '900', color: t.colors.text }}
          />

          {/* --- Quick fill chips (Overlap Fix Applied) --- */}
          {!!selected && (
            <View style={{ flexDirection:'row', flexWrap: 'wrap', marginBottom: 5 }}>
              <Text style={{ 
                color: t.colors.sub, 
                alignSelf: 'center', 
                marginRight: 12, 
                marginBottom: 8, 
                marginTop: 4, 
              }}>Quick Amounts:</Text>

              {[100,500,1000,5000].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setAmount(String(v))}
                  style={{ 
                    paddingHorizontal:12, 
                    paddingVertical:8, 
                    borderRadius:999, 
                    borderWidth:1, 
                    borderColor:t.colors.border, 
                    backgroundColor:t.colors.card,
                    // FIX: Ensures correct spacing when wrapping to a new line
                    marginRight: 8, 
                    marginBottom: 8, 
                  }}
                >
                  <Text style={{ fontWeight:'700', color:t.colors.text }}>{formatMoney(v, selected.currency)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* --- Remarks --- */}
          <Input 
            placeholder="e.g., Cash Deposit, ATM Top-up" 
            label="Remarks (optional)"
            value={remarks} 
            onChangeText={setRemarks} 
          />

          {/* --- Submit Button --- */}
          <Button 
            title={busy ? 'Processing…' : `Deposit ${isAmountValid && selected ? formatMoney(amount, selected.currency) : ''}`} 
            onPress={submit} 
            disabled={!canSubmit} 
            style={{ marginTop: 10 }}
          />

          {/* --- Feedback --- */}
          {msg ? (
            <Text style={{ 
              marginTop:6, 
              textAlign: 'center',
              color: msg.startsWith('✅') ? t.colors.primary : t.colors.error || '#b91c1c', 
              fontWeight: msg.startsWith('✅') ? '700' : '400'
            }}>{msg}</Text>
          ) : null}
        </Card>

        {/* --- Inline list of accounts (context/help) --- */}
        <Card style={{ marginTop:16 }}>
          <Text style={{ fontWeight:'800', color:t.colors.text, marginBottom:10 }}>Account Balances</Text>
          {accounts.length
            ? accounts.map(a => (
                <Pressable 
                    key={a.id} 
                    onPress={() => { setSelected(a); }} 
                    style={{ paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:t.colors.border }}
                >
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems: 'center' }}>
                      <Text style={{ 
                        color: String(a.id) === String(selected?.id) ? t.colors.primary : t.colors.text, 
                        fontWeight:'700' 
                      }}>
                        {a.account_number} • {(a.currency || 'PHP').toUpperCase()}
                        {String(a.id) === String(selected?.id) && ' (Selected)'}
                      </Text>
                      <Text style={{ color:t.colors.text, fontWeight:'800' }}>{formatMoney(a.balance, a.currency)}</Text>
                    </View>
                </Pressable>
              ))
            : <Text style={{ color:t.colors.sub }}>No open accounts yet.</Text>
          }
        </Card>
      </ScrollView>

      {/* --- Account Picker Modal --- */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' }}>
          <View style={{
            backgroundColor:t.colors.card, borderTopLeftRadius:18, borderTopRightRadius:18, padding:16, maxHeight:'60%'
          }}>
            <Text style={{ fontWeight:'900', fontSize:18, color:t.colors.text, marginBottom:12 }}>Select Destination Account</Text>
            <FlatList
              data={accounts}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSelected(item); setShowPicker(false); }}
                  style={{ 
                    paddingVertical:14, 
                    borderBottomWidth:0.5, 
                    borderBottomColor:t.colors.border,
                    backgroundColor: String(item.id) === String(selected?.id) ? t.colors.primary + '10' : 'transparent' 
                  }}
                >
                  <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                    <Text style={{ fontWeight:'800', color:t.colors.text, fontSize:15 }}>
                      {item.account_number} • {(item.currency || 'PHP').toUpperCase()}
                    </Text>
                    <Text style={{ color:t.colors.text, fontWeight:'900' }}>{formatMoney(item.balance, item.currency)}</Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={{ color:t.colors.sub }}>No accounts found.</Text>}
            />
            <Button title="Close" variant="ghost" style={{ marginTop:16 }} onPress={() => setShowPicker(false)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}