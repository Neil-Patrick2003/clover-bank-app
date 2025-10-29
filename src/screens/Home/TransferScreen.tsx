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

// --- Type Definitions (kept as is) ---
const RecipientModes = ['Account #', 'Email', 'Username'] as const;

// Helper to format money (kept as is)
const formatMoney = (amt, cur) => {
  const n = Number(amt) || 0;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'PHP').toUpperCase() }).format(n); }
  catch { return `${(cur || 'PHP').toUpperCase()} ${n.toFixed(2)}`; }
};

export default function TransferScreen() {
  const t = useTheme();

  // --- State (kept as is) ---
  const [accounts, setAccounts] = useState([]);
  const [from, setFrom] = useState(null); 
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<typeof RecipientModes[number]>('Account #');
  const [recipient, setRecipient] = useState('');
  const [resolved, setResolved] = useState(null); 
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- Effects & Memos (kept as is) ---
  useEffect(() => {
    (async () => {
      const { data } = await api.get('/accounts');
      setAccounts(data ?? []);
      if ((data ?? []).length === 1) setFrom(data[0]);
    })();
  }, []);

  const isAmountValid = useMemo(() => {
    const n = Number(amount);
    return !Number.isNaN(n) && n > 0;
  }, [amount]);

  const canResolve = useMemo(() => {
    if (!recipient.trim()) return false;
    if (mode === 'Account #') return recipient.trim().length >= 6; 
    if (mode === 'Email')     return /\S+@\S+\.\S+/.test(recipient.trim());
    return recipient.trim().length >= 3; 
  }, [mode, recipient]);

  const canSubmit = !!from && !!resolved && isAmountValid && !busy;

  // --- Functions (kept as is) ---
  const doResolve = async () => {
    if (!canResolve) return;
    setResolved(null); setMsg('');
    try {
      const params =
        mode === 'Account #' ? { account_number: recipient.trim() } :
        mode === 'Email'     ? { email: recipient.trim() } :
                               { username: recipient.trim() };
      const { data } = await api.get('/accounts/resolve', { params });
      setResolved(data);
    } catch (e) {
      setResolved(null);
      setMsg('❌ ' + (e?.response?.data?.message || 'Could not resolve recipient'));
    }
  };

  const openConfirm = async () => {
    setMsg('');
    // Ensure we attempt to resolve even if state hasn't updated yet
    if (!resolved) await doResolve();
    // Only proceed to confirm if resolved state is now truthy
    if (resolved) setShowConfirm(true); 
    // Small UX fix: if doResolve fails, the modal won't show, but the error message will.
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setMsg('');
    try {
      const payload = {
        from_account_id: Number(from.id),
        to_account_number: resolved.account_number,
        amount: Number(amount),
        remarks: remarks || undefined,
      };
      const { data } = await api.post('/transfers', payload);
      setMsg(`✅ Success. Ref: ${data.reference_no}`);

      // reset form
      setAmount(''); setRemarks(''); setRecipient(''); setResolved(null); setShowConfirm(false);

      // refresh balances
      const fresh = await api.get('/accounts');
      setAccounts(fresh.data ?? []);
      const updated = (fresh.data ?? []).find(a => String(a.id) === String(from.id));
      if (updated) setFrom(updated);
    } catch (e) {
      setMsg('❌ ' + (e?.response?.data?.message || 'Failed to post transfer'));
    } finally {
      setBusy(false);
    }
  };
  
  // --- Render ---

  // Use a KeyboardAvoidingView to push content up when the keyboard is open
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20} // Adjust offset as needed for header/status bar
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16 }} 
        // Important: allows scrolling when keyboard is open
        automaticallyAdjustContentInsets={false} 
      >
        <Card style={{ gap:18 }}> {/* Increased gap for better spacing */}
          <Text style={{ fontWeight:'800', color:t.colors.text, fontSize:20 }}>💸 New Transfer</Text>

          {/* --- From Account Selector (Improved Design) --- */}
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              borderWidth:1, 
              borderColor: t.colors.border, 
              backgroundColor: t.colors.card, // Using card color for background
              paddingHorizontal:16, 
              paddingVertical:14, 
              borderRadius:16, // More rounded corners
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: from ? t.colors.text : t.colors.sub, fontWeight:'700', fontSize: 16 }}>
                {from
                  ? `${(from.currency || 'PHP').toUpperCase()} • ${from.account_number}`
                  : 'Select source account'}
              </Text>
              {!!from && (
                <Text style={{ marginTop:4, color:t.colors.text, fontWeight:'900' }}>
                  {formatMoney(from.balance, from.currency)} {/* Balance more prominent */}
                </Text>
              )}
            </View>
            <Text style={{ color: t.colors.sub, fontSize: 18, fontWeight: 'bold' }}>&gt;</Text> {/* Visual indicator */}
          </Pressable>

          {/* --- Recipient Mode Segmented Control (Cleaner Design) --- */}
          <View style={{ flexDirection:'row', borderWidth:1, borderColor:t.colors.border, borderRadius:12 }}>
            {RecipientModes.map((m, index) => {
              const active = m === mode;
              return (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setResolved(null); }}
                  style={{
                    flex: 1,
                    paddingHorizontal:10, 
                    paddingVertical:10, 
                    backgroundColor: active ? t.colors.primary : 'transparent',
                    borderRadius: active ? 12 : 0, // Rounding only active pill for cleaner look
                    margin: active ? -1 : 0, // Tweak to make active pill overlap the border for a cleaner look
                    zIndex: active ? 1 : 0,
                    // Add separators for inactive pills if desired:
                    borderLeftWidth: index > 0 && !active && RecipientModes[index - 1] !== mode ? 1 : 0,
                    borderLeftColor: t.colors.border,
                  }}
                >
                  <Text style={{ 
                    fontWeight:'800', 
                    textAlign: 'center',
                    color: active ? (t.colors.onPrimary ?? '#fff') : t.colors.text 
                  }}>{m}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* --- Recipient input + Resolve button --- */}
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ flex:1 }}>
              <Input
                placeholder={mode === 'Account #' ? 'Enter account number' : mode === 'Email' ? 'Enter email' : 'Enter username'}
                value={recipient}
                onChangeText={(v) => { setRecipient(v); setResolved(null); }}
                keyboardType={mode === 'Account #' ? 'number-pad' : 'default'}
              />
            </View>
            <Button title="Resolve" onPress={doResolve} disabled={!canResolve} style={{ minWidth: 90 }} />
          </View>

          {/* --- Resolved summary (Themed) --- */}
          {!!resolved && (
            <View style={{
              // Use a subtle background color based on theme for success
              backgroundColor: t.colors.successBg || '#ECFDF5', 
              borderWidth:1, 
              borderColor: t.colors.successBorder || '#D1FAE5',
              padding:14, 
              borderRadius:12
            }}>
              <Text style={{ color:t.colors.successText || '#065F46', fontWeight:'800', marginBottom: 4 }}>Recipient Found</Text>
              <Text style={{ color:t.colors.text }}>
                **{resolved.recipient?.username || resolved.recipient?.email || 'Unknown'}**
              </Text>
              <Text style={{ color:t.colors.sub }}>
                Acct: {resolved.account_number} • Currency: **{(resolved.currency || 'PHP').toUpperCase()}**
              </Text>
            </View>
          )}

          {/* --- Amount (More Prominent) --- */}
          <Input 
            placeholder="0.00" 
            label={`Amount (${from?.currency || 'PHP'})`} // Added label for clarity
            value={amount} 
            onChangeText={setAmount} 
            keyboardType="decimal-pad" 
            style={{ fontSize: 24, fontWeight: '900' }} // Larger/bolder font inside input
          />

          {/* --- Quick amount chips --- */}
          {!!from && (
            <View style={{ flexDirection:'row', gap:8, flexWrap: 'wrap' }}>
              {[100,500,1000,5000].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setAmount(String(v))}
                  style={{ 
                    paddingHorizontal:12, paddingVertical:8, borderRadius:999, 
                    borderWidth:1, borderColor:t.colors.border, backgroundColor:t.colors.card 
                  }}
                >
                  <Text style={{ fontWeight:'700', color:t.colors.text }}>{formatMoney(v, from.currency)}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* --- Remarks --- */}
          <Input 
            placeholder="Remarks (e.g., Dinner fund)" 
            label="Remarks (optional)"
            value={remarks} 
            onChangeText={setRemarks} 
          />

          {/* --- Review & Send --- */}
          <Button
            title="Review & Confirm Transfer"
            onPress={openConfirm}
            disabled={!from || !canResolve || !isAmountValid || busy}
            style={{ marginTop: 10 }}
          />

          {/* --- Feedback --- */}
          {msg ? <Text style={{ marginTop:6, color: msg.startsWith('✅') ? t.colors.successText || t.colors.primary : t.colors.error || '#b91c1c' }}>{msg}</Text> : null}
        </Card>

        {/* --- Inline list of accounts to quickly switch From --- */}
        <Card style={{ marginTop:16 }}> {/* Increased margin for separation */}
          <Text style={{ fontWeight:'800', color:t.colors.text, marginBottom:10 }}>Your Other Accounts</Text>
          {accounts.length > (from ? 1 : 0) // Only show accounts other than the selected one
            ? accounts
                .filter(a => a.id !== from?.id)
                .map(a => (
                <Pressable 
                    key={a.id} 
                    onPress={() => { setFrom(a); }} 
                    style={{ paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:t.colors.border }}
                >
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems: 'center' }}>
                      <Text style={{ color:t.colors.text, fontWeight:'700' }}>
                        {a.account_number} • {(a.currency || 'PHP').toUpperCase()}
                      </Text>
                      <Text style={{ color:t.colors.text, fontWeight:'800' }}>{formatMoney(a.balance, a.currency)}</Text>
                    </View>
                </Pressable>
              ))
            : <Text style={{ color:t.colors.sub }}>No other accounts available.</Text>
          }
        </Card>
      </ScrollView>

      {/* --- Modals (kept as is, but styled with theme colors) --- */}
      
      {/* From account picker (bottom sheet style) */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:t.colors.card, borderTopLeftRadius:18, borderTopRightRadius:18, padding:16, maxHeight:'60%' }}>
            <Text style={{ fontWeight:'900', fontSize:18, color:t.colors.text, marginBottom:12 }}>Select Source Account</Text>
            <FlatList
              data={accounts}
              keyExtractor={(it) => String(it.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setFrom(item); setShowPicker(false); }}
                  style={{ paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:t.colors.border }}
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

      {/* Confirm modal (Improved amount prominence) */}
      <Modal visible={showConfirm} animationType="fade" transparent onRequestClose={() => setShowConfirm(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', padding:16 }}>
          <View style={{ backgroundColor:t.colors.card, borderRadius:16, padding:20 }}>
            <Text style={{ fontWeight:'900', fontSize:20, color:t.colors.text, marginBottom:16, textAlign: 'center' }}>Review Transfer</Text>
            
            <View style={{ gap:6, marginBottom:16, padding: 8, backgroundColor: t.colors.bg, borderRadius: 8 }}>
              <Text style={{ color:t.colors.sub, fontSize: 13 }}>FROM</Text>
              <Text style={{ fontWeight:'800', color:t.colors.text, fontSize: 16 }}>
                {from?.account_number} • {(from?.currency || 'PHP').toUpperCase()}
              </Text>
            </View>

            <View style={{ gap:6, marginBottom:16, padding: 8, backgroundColor: t.colors.bg, borderRadius: 8 }}>
              <Text style={{ color:t.colors.sub, fontSize: 13 }}>TO</Text>
              <Text style={{ fontWeight:'800', color:t.colors.text, fontSize: 16 }}>
                {resolved?.recipient?.username || resolved?.recipient?.email || 'Account'} • {resolved?.account_number}
              </Text>
            </View>
            
            {/* Amount is the most prominent element */}
            <View style={{ gap:6, marginBottom:20, alignItems: 'center' }}>
              <Text style={{ color:t.colors.sub, fontSize: 14 }}>AMOUNT</Text>
              <Text style={{ fontWeight:'900', fontSize: 32, color: t.colors.primary }}>
                {formatMoney(amount, from?.currency)}
              </Text>
            </View>

            {!!remarks && (
              <View style={{ gap:6, marginBottom:16, padding: 8, backgroundColor: t.colors.bg, borderRadius: 8 }}>
                <Text style={{ color:t.colors.sub, fontSize: 13 }}>REMARKS</Text>
                <Text style={{ color:t.colors.text }}>{remarks}</Text>
              </View>
            )}

            <View style={{ flexDirection:'row', gap:10, marginTop:10 }}>
              <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setShowConfirm(false)} />
              <Button 
                title={busy ? 'Sending…' : 'Confirm & Send'} 
                style={{ flex: 1 }} 
                onPress={submit} 
                disabled={!canSubmit} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}