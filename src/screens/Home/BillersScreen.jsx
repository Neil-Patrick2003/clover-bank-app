// src/screens/Home/BillersScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, Pressable, Modal,
  KeyboardAvoidingView, Platform, ScrollView, TextInput, ActivityIndicator
} from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Input, Button } from '../../components/ui';

export default function BillersScreen() {
  const t = useTheme();

  // Data
  const [accounts, setAccounts] = useState([]);
  const [billers, setBillers] = useState([]);

  // Selection
  const [account, setAccount] = useState(null);
  const [biller, setBiller] = useState(null);

  // UI state
  const [showAcctPicker, setShowAcctPicker] = useState(false);
  const [showBillerPicker, setShowBillerPicker] = useState(false);
  const [billerQuery, setBillerQuery] = useState('');

  // Form
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadErr('');
        const [a, b] = await Promise.all([api.get('/accounts'), api.get('/billers')]);
        setAccounts(a.data ?? []);
        setBillers(b.data ?? []);
        if ((a.data ?? []).length === 1) setAccount(a.data[0]); // auto-pick if only one
      } catch (e) {
        setLoadErr(e?.message || 'Failed to load accounts/billers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredBillers = useMemo(() => {
    const q = billerQuery.trim().toLowerCase();
    if (!q) return billers;
    return (billers ?? []).filter(b =>
      [b.biller_name, b.biller_code].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [billers, billerQuery]);

  const formatMoney = (amt, cur) => {
    const n = Number(amt) || 0;
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'PHP').toUpperCase() }).format(n); }
    catch { return `${(cur || 'PHP').toUpperCase()} ${n.toFixed(2)}`; }
  };

  const isAmountValid = () => {
    const n = Number(amount);
    return !Number.isNaN(n) && n > 0;
  };

  const canSubmit = !!account && !!biller && isAmountValid() && !busy;

  const openConfirm = () => {
    setMsg('');
    if (canSubmit) setShowConfirm(true);
  };

  const pay = async () => {
    if (!canSubmit) return;
    setBusy(true); setMsg('');
    try {
      const payload = {
        account_id: Number(account.id),
        biller_id: Number(biller.id),
        amount: Number(amount),
        reference: reference || undefined,
      };
      const { data } = await api.post('/bill-payments', payload);
      setMsg(`✅ Paid. Ref: ${data.reference_no}`);

      // reset essentials
      setAmount('');
      setReference('');
      setShowConfirm(false);

      // refresh account balance
      const fresh = await api.get('/accounts');
      setAccounts(fresh.data ?? []);
      const updated = (fresh.data ?? []).find(a => String(a.id) === String(account.id));
      if (updated) setAccount(updated);
    } catch (e) {
      setMsg('❌ ' + (e?.response?.data?.message || 'Payment failed'));
    } finally {
      setBusy(false);
    }
  };

  const LoadingCard = () => (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ActivityIndicator />
        <Text style={{ color: t.colors.sub }}>Loading…</Text>
      </View>
    </Card>
  );

  const ErrorCard = () => (
    <Card>
      <Text style={{ color: '#8C1D18', fontWeight: '800' }}>Couldn’t load data</Text>
      <Text style={{ color: '#8C1D18', marginTop: 4 }}>{loadErr}</Text>
      <View style={{ height: 8 }} />
      <Button title="Retry" onPress={() => {
        // Simple retry: re-run the effect logic
        setLoading(true); setLoadErr('');
        Promise.all([api.get('/accounts'), api.get('/billers')])
          .then(([a, b]) => {
            setAccounts(a.data ?? []);
            setBillers(b.data ?? []);
            if ((a.data ?? []).length === 1) setAccount(a.data[0]);
          })
          .catch(e => setLoadErr(e?.message || 'Failed to load accounts/billers.'))
          .finally(() => setLoading(false));
      }} />
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          {loading ? <LoadingCard /> : loadErr ? <ErrorCard /> : (
            <>
              {/* Billers preview */}
              <Card>
                <Text style={{ fontWeight: '800', color: t.colors.text, marginBottom: 8 }}>Active Billers</Text>
                {billers?.length ? (
                  <FlatList
                    data={billers.slice(0, 8)} // preview – open picker for full list
                    keyExtractor={(it) => String(it.id)}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                    renderItem={({ item }) => (
                      <Pressable onPress={() => setBiller(item)}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                          <Text style={{ color: t.colors.text, fontWeight: '700' }}>{item.biller_name}</Text>
                          <Text style={{ color: t.colors.sub }}>{item.biller_code}</Text>
                        </View>
                      </Pressable>
                    )}
                    ListEmptyComponent={<Text style={{ color: t.colors.sub }}>No active billers.</Text>}
                  />
                ) : (
                  <Text style={{ color: t.colors.sub }}>No active billers.</Text>
                )}
                <Button title="Browse all billers" variant="ghost" style={{ marginTop: 8 }} onPress={() => setShowBillerPicker(true)} />
              </Card>

              {/* Pay form */}
              <Card style={{ gap: 14 }}>
                <Text style={{ fontWeight: '800', color: t.colors.text, fontSize: 16 }}>Pay a bill</Text>

                {/* Account selector */}
                <Pressable
                  onPress={() => setShowAcctPicker(true)}
                  style={{
                    borderWidth: 1, borderColor: t.colors.border, backgroundColor: '#fff',
                    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
                  }}
                >
                  <Text style={{ color: account ? t.colors.text : t.colors.placeholder, fontWeight: '700' }}>
                    {account
                      ? `${account.account_number} • ${(account.currency || 'PHP').toUpperCase()}`
                      : 'Select source account'}
                  </Text>
                  {!!account && (
                    <Text style={{ marginTop: 4, color: t.colors.sub }}>
                      Balance: {formatMoney(account.balance, account.currency)}
                    </Text>
                  )}
                </Pressable>

                {/* Biller selector */}
                <Pressable
                  onPress={() => setShowBillerPicker(true)}
                  style={{
                    borderWidth: 1, borderColor: t.colors.border, backgroundColor: '#fff',
                    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
                  }}
                >
                  <Text style={{ color: biller ? t.colors.text : t.colors.placeholder, fontWeight: '700' }}>
                    {biller ? `${biller.biller_name} (${biller.biller_code})` : 'Select biller'}
                  </Text>
                </Pressable>

                {/* Amount */}
                <Input
                  placeholder="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />

                {/* Quick chips */}
                {!!account && (
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[100, 300, 500, 1000].map(v => (
                      <Pressable
                        key={v}
                        onPress={() => setAmount(String(v))}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                          borderWidth: 1, borderColor: t.colors.border, backgroundColor: '#fff',
                        }}
                      >
                        <Text style={{ fontWeight: '700', color: t.colors.text }}>
                          {formatMoney(v, account.currency)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Reference */}
                <Input
                  placeholder="Reference (e.g., Meralco Oct)"
                  value={reference}
                  onChangeText={setReference}
                />

                {/* Review & Pay */}
                <Button
                  title="Review"
                  onPress={openConfirm}
                  disabled={!account || !biller || !isAmountValid() || busy}
                  style={{ opacity: (!account || !biller || !isAmountValid() || busy) ? 0.6 : 1 }}
                />

                {/* Feedback */}
                {!!msg && (
                  <Text style={{ marginTop: 6, color: msg.startsWith('✅') ? t.colors.primary : '#b91c1c' }}>
                    {msg}
                  </Text>
                )}
              </Card>

              {/* Quick switch accounts */}
              <Card>
                <Text style={{ fontWeight: '800', color: t.colors.text, marginBottom: 8 }}>Your Accounts</Text>
                {accounts.length ? (
                  accounts.map(a => (
                    <Pressable key={a.id} onPress={() => setAccount(a)} style={{ paddingVertical: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: t.colors.text, fontWeight: '700' }}>
                          {a.account_number} • {(a.currency || 'PHP').toUpperCase()}
                        </Text>
                        <Text style={{ color: t.colors.sub }}>{formatMoney(a.balance, a.currency)}</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <Text style={{ color: t.colors.sub }}>No open accounts yet.</Text>
                )}
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account Picker */}
      <Modal visible={showAcctPicker} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowAcctPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '60%' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: t.colors.text, marginBottom: 8 }}>Select source account</Text>
              <FlatList
                data={accounts}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setAccount(item); setShowAcctPicker(false); }}
                    style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '800', color: t.colors.text }}>
                        {item.account_number} • {(item.currency || 'PHP').toUpperCase()}
                      </Text>
                      <Text style={{ color: t.colors.sub }}>{formatMoney(item.balance, item.currency)}</Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={{ color: t.colors.sub }}>No accounts found.</Text>}
                keyboardShouldPersistTaps="handled"
              />
              <Button title="Close" variant="ghost" style={{ marginTop: 12 }} onPress={() => setShowAcctPicker(false)} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Biller Picker (with search) */}
      <Modal visible={showBillerPicker} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowBillerPicker(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, maxHeight: '70%' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: t.colors.text, marginBottom: 8 }}>Select biller</Text>

              <View style={{
                borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, marginBottom: 10
              }}>
                <TextInput
                  placeholder="Search by name or code…"
                  placeholderTextColor={t.colors.placeholder ?? '#94a3b8'}
                  value={billerQuery}
                  onChangeText={setBillerQuery}
                  style={{ paddingVertical: 10, color: t.colors.text }}
                />
              </View>

              <FlatList
                data={filteredBillers}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => { setBiller(item); setShowBillerPicker(false); }}
                    style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}
                  >
                    <View>
                      <Text style={{ fontWeight: '800', color: t.colors.text }}>{item.biller_name}</Text>
                      <Text style={{ color: t.colors.sub }}>{item.biller_code}</Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={{ color: t.colors.sub }}>No billers found.</Text>}
                keyboardShouldPersistTaps="handled"
              />

              <Button title="Close" variant="ghost" style={{ marginTop: 12 }} onPress={() => setShowBillerPicker(false)} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Confirm modal */}
      <Modal visible={showConfirm} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: t.colors.text, marginBottom: 8 }}>Confirm Payment</Text>

              <View style={{ gap: 6, marginBottom: 8 }}>
                <Text style={{ color: t.colors.sub }}>From</Text>
                <Text style={{ fontWeight: '800', color: t.colors.text }}>
                  {account?.account_number} • {(account?.currency || 'PHP').toUpperCase()}
                </Text>
              </View>

              <View style={{ gap: 6, marginBottom: 8 }}>
                <Text style={{ color: t.colors.sub }}>Biller</Text>
                <Text style={{ fontWeight: '800', color: t.colors.text }}>
                  {biller?.biller_name} ({biller?.biller_code})
                </Text>
              </View>

              <View style={{ gap: 6, marginBottom: 8 }}>
                <Text style={{ color: t.colors.sub }}>Amount</Text>
                <Text style={{ fontWeight: '900', color: '#065f46' }}>
                  {formatMoney(amount, account?.currency)}
                </Text>
              </View>

              {!!reference && (
                <View style={{ gap: 6, marginBottom: 8 }}>
                  <Text style={{ color: t.colors.sub }}>Reference</Text>
                  <Text style={{ color: t.colors.text }}>{reference}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Button title="Cancel" variant="ghost" onPress={() => setShowConfirm(false)} />
                <Button title={busy ? 'Paying…' : 'Confirm & Pay'} onPress={pay} disabled={!canSubmit} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
