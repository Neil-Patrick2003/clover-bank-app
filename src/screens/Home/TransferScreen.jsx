import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet, // <-- Added StyleSheet
} from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Input, Button } from '../../components/ui';
import ToastComponent from '../../components/ui/ToastComponent';

// --- Constants (No change)
const RecipientModes = ['Account #', 'Email', 'Username'];

const formatMoney = (amt, cur) => {
  const n = Number(amt) || 0;
  const currency = (cur || 'PHP').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};
// --- End Constants

export default function TransferScreen() {
  const t = useTheme();
  const { colors } = t;

  // Re-use color variables for clearer styling
  const cardColor = colors.card || colors.surface || '#111827';
  const mutedColor = colors.sub || colors.muted || '#9CA3AF';
  const primaryColor = colors.primary || '#2563EB';
  const primaryText = colors.onPrimary || '#ffffff';
  const successBg = colors.successBg || '#ECFDF5';
  const successBorder = colors.successBorder || '#D1FAE5';
  const successText = colors.successText || '#065F46';
  const errorColor = colors.error || '#EF4444';
  const textColor = colors.text || '#000000';
  const borderColor = colors.border || '#E5E7EB';

  // --- State & Logic (No change, keeping for completeness)
  const [accounts, setAccounts] = useState([]);
  const [from, setFrom] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const [mode, setMode] = useState(RecipientModes[0]);
  const [recipient, setRecipient] = useState('');
  const [resolved, setResolved] = useState(null);

  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState(null); // 'success' | 'error'

  const displayToast = useCallback((message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);

  const dismissToast = useCallback(() => {
    setShowToast(false);
    setToastMessage('');
    setToastType(null);
  }, []);

  const refreshAccountBalances = useCallback(async (currentSelectedId) => {
    try {
      const { data: freshAccounts } = await api.get('/accounts');
      const list = freshAccounts ?? [];
      setAccounts(list);

      const updated = list.find(
        (a) => String(a.id) === String(currentSelectedId)
      );
      if (updated) setFrom(updated);
    } catch (e) {
      console.error('Failed to refresh balances:', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/accounts');
        const fetchedAccounts = data ?? [];
        setAccounts(fetchedAccounts);
        if (fetchedAccounts.length > 0) {
          setFrom(fetchedAccounts[0]);
        }
      } catch (e) {
        console.error('Failed to load accounts:', e);
      }
    })();
  }, []);

  const isAmountValid = useMemo(() => {
    const n = parseFloat(amount);
    const balance = from?.balance || 0;
    return !Number.isNaN(n) && n > 0 && n <= balance;
  }, [amount, from]);

  const isBalanceSufficient = useMemo(() => {
    const n = parseFloat(amount);
    const balance = from?.balance || 0;
    if (Number.isNaN(n)) return true;
    return n <= balance;
  }, [amount, from]);

  const canResolve = useMemo(() => {
    if (!recipient.trim()) return false;
    if (mode === 'Account #' && recipient.trim() === from?.account_number)
      return false;

    if (mode === 'Account #') return recipient.trim().length >= 6;
    if (mode === 'Email') return /\S+@\S+\.\S+/.test(recipient.trim());
    return recipient.trim().length >= 3;
  }, [mode, recipient, from]);

  const canSubmit = !!from && !!resolved && isAmountValid && !busy;

  const handleAmountChange = useCallback(
    (text) => {
      let cleanedText = text.replace(/[^0-9.]/g, '');
      const parts = cleanedText.split('.');
      if (parts.length > 2) {
        cleanedText = parts[0] + '.' + parts.slice(1).join('');
      }
      setAmount(cleanedText);
      if (showToast) dismissToast();
    },
    [showToast, dismissToast]
  );

  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode);
      setResolved(null);
      setRecipient('');
      if (showToast) dismissToast();
    },
    [showToast, dismissToast]
  );

  const doResolve = useCallback(async () => {
    if (!canResolve) return;
    setResolved(null);
    if (showToast) dismissToast();
    setBusy(true);

    try {
      const params =
        mode === 'Account #'
          ? { account_number: recipient.trim() }
          : mode === 'Email'
          ? { email: recipient.trim() }
          : { username: recipient.trim() };

      const { data } = await api.get('/accounts/resolve', { params });

      if (data.account_number === from?.account_number) {
        displayToast('Cannot transfer to the source account.', 'error');
        setResolved(null);
        return;
      }

      setResolved(data);
    } catch (e) {
      setResolved(null);
      const errorMessage =
        e?.response?.data?.message ||
        'Could not resolve recipient. Please check the details.';
      console.error('API Resolve Error:', errorMessage, e);
      displayToast(errorMessage, 'error');
    } finally {
      setBusy(false);
    }
  }, [canResolve, mode, recipient, from, showToast, dismissToast, displayToast]);

  const openConfirm = async () => {
    if (showToast) dismissToast();

    if (!resolved) {
      displayToast('Please resolve the recipient first.', 'error');
      return;
    }

    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) {
      displayToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    if (!isBalanceSufficient) {
      displayToast(
        `Insufficient balance. Max available: ${formatMoney(
          from?.balance,
          from?.currency
        )}`,
        'error'
      );
      return;
    }

    if (canSubmit) {
      setShowConfirm(true);
    }
  };

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setBusy(true);
    if (showToast) dismissToast();

    try {
      const payload = {
        from_account_id: Number(from.id),
        to_account_number: resolved.account_number,
        amount: parseFloat(amount),
        remarks: remarks || undefined,
      };

      const { data } = await api.post('/transfers', payload);

      // Extract transfer ID from API response
      const refNo = data.transfer_id || data.reference_no || data.id;
      displayToast(`Transfer successful! Ref: ${refNo}`, 'success');

      setAmount('');
      setRemarks('');
      setRecipient('');
      setResolved(null);
      setShowConfirm(false);

      await refreshAccountBalances(from.id);
    } catch (e) {
      displayToast(
        e?.response?.data?.message ||
          'Failed to post transfer. Please check limits.',
        'error'
      );
      setShowConfirm(false);
    } finally {
      setBusy(false);
    }
  }, [
    canSubmit,
    from,
    resolved,
    amount,
    remarks,
    refreshAccountBalances,
    showToast,
    dismissToast,
    displayToast,
  ]);
  // --- End State & Logic

  // --- Components (Updated Styling)
  const AccountPickerModal = () => (
    <Modal
      visible={showPicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPicker(false)}
    >
      <Pressable
        style={styles.modalOverlay} // Use a style object
        onPress={() => setShowPicker(false)}
      >
        <Pressable
          style={[
            styles.modalContent,
            { backgroundColor: cardColor, borderTopColor: primaryColor },
          ]}
          onPress={() => {}}
        >
          <Text
            style={[
              styles.modalTitle,
              { color: textColor, borderBottomColor: borderColor },
            ]}
          >
            Select Source Account
          </Text>
          <FlatList
            data={accounts}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => {
              const active = String(item.id) === String(from?.id);
              return (
                <Pressable
                  onPress={() => {
                    setFrom(item);
                    setShowPicker(false);
                    if (showToast) dismissToast();
                  }}
                  style={[
                    styles.pickerItem,
                    {
                      borderBottomColor: borderColor,
                      backgroundColor: active
                        ? primaryColor + '15' // Subtle highlight
                        : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.pickerItemContent}>
                    <Text
                      style={[
                        styles.pickerItemAccount,
                        { color: textColor },
                      ]}
                    >
                      {item.account_number} •{' '}
                      {(item.currency || 'PHP').toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        styles.pickerItemBalance,
                        { color: active ? primaryColor : textColor }, // Highlight balance
                      ]}
                    >
                      {formatMoney(item.balance, item.currency)}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: mutedColor, paddingVertical: 16 }}>
                No accounts found.
              </Text>
            }
          />
          <Button
            title="Close"
            variant="outline" // Changed to 'outline' for better contrast
            style={{ marginTop: 16 }}
            onPress={() => setShowPicker(false)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );

  const ConfirmModal = () => (
    <Modal
      visible={showConfirm}
      animationType="fade"
      transparent
      onRequestClose={() => setShowConfirm(false)}
    >
      <Pressable
        style={styles.confirmModalOverlay}
        onPress={() => setShowConfirm(false)}
      >
        <Pressable
          style={[styles.confirmModalContent, { backgroundColor: cardColor }]}
          onPress={() => {}}
        >
          <Text style={[styles.confirmModalTitle, { color: textColor }]}>
            Review Transfer Details
          </Text>

          {/* Transfer Details Section */}
          <View style={styles.detailsSection}>
            <DetailItem label="From" value={from ? `${from.account_number} • ${(from.currency || 'PHP').toUpperCase()}` : '-'} />
            <View style={styles.detailItemContainer}>
              <Text style={[styles.detailLabel, { color: mutedColor }]}>To</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>
                {resolved?.recipient?.username || 'Recipient'}
              </Text>
              <Text style={[styles.detailSubValue, { color: mutedColor }]}>
                {`Account: ${resolved?.account_number}`}
              </Text>
            </View>

            <View style={styles.detailItemContainer}>
              <Text style={[styles.detailLabel, { color: mutedColor }]}>Amount</Text>
              <Text style={[styles.amountValue, { color: primaryColor }]}>
                {formatMoney(amount, from?.currency)}
              </Text>
            </View>

            {!!remarks && (
              <DetailItem label="Remarks" value={remarks} />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.confirmActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowConfirm(false)}
            />
            <Button
              title={busy ? 'Processing...' : 'Confirm'}
              onPress={submit}
              disabled={busy}
              style={{ flex: 1 }} // Make button fill available space
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const DetailItem = ({ label, value }) => (
    <View style={styles.detailItemContainer}>
      <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]}>{value}</Text>
    </View>
  );

  // --- Main Render (Updated Styling)
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          automaticallyAdjustContentInsets={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Card */}
          <Card style={[styles.mainCard, { backgroundColor: cardColor }]}>
            <Text
              style={[
                styles.headerTitle,
                { color: textColor },
              ]}
            >
              💸 New Transfer
            </Text>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* From account - Enhanced Pressable Design */}
            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => [
                styles.accountSelect,
                {
                  borderColor: borderColor,
                  backgroundColor: pressed ? cardColor + 'E0' : cardColor,
                },
              ]}
            >
              <Text style={styles.accountIcon}>📤</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.accountNumber,
                    {
                      color: from ? textColor : mutedColor,
                    },
                  ]}
                >
                  {from
                    ? `${(from.currency || 'PHP').toUpperCase()} • ${
                        from.account_number
                      }`
                    : 'Select source account'}
                </Text>
                {!!from && (
                  <Text
                    style={[
                      styles.accountBalance,
                      {
                        color: mutedColor,
                      },
                    ]}
                  >
                    Available Balance:{' '}
                    <Text style={{ fontWeight: '700', color: textColor }}>
                      {formatMoney(from.balance, from.currency)}
                    </Text>
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.arrowIcon,
                  {
                    color: mutedColor,
                  },
                ]}
              >
                &gt;
              </Text>
            </Pressable>

            {/* Recipient mode toggle - Cleaner look */}
            <View
              style={[
                styles.modeToggleContainer,
                { borderColor: borderColor },
              ]}
            >
              {RecipientModes.map((m, idx) => {
                const active = m === mode;
                return (
                  <Pressable
                    key={m}
                    onPress={() => handleModeChange(m)}
                    style={[
                      styles.modeToggleItem,
                      {
                        backgroundColor: active ? primaryColor : 'transparent',
                        borderRightWidth: idx !== RecipientModes.length - 1 ? 1 : 0,
                        borderRightColor: borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeToggleText,
                        {
                          color: active ? primaryText : textColor,
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Recipient Input & Resolve */}
            <View style={styles.recipientInputGroup}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder={
                    mode === 'Account #'
                      ? 'Enter account number'
                      : mode === 'Email'
                      ? 'Enter email'
                      : 'Enter username'
                  }
                  value={recipient}
                  onChangeText={(v) => {
                    setRecipient(v);
                    setResolved(null);
                    if (showToast) dismissToast();
                  }}
                  keyboardType={
                    mode === 'Account #' ? 'number-pad' : 'default'
                  }
                />
              </View>
              <Button
                title={busy && !showConfirm ? '...' : 'Resolve'}
                onPress={doResolve}
                disabled={!canResolve || busy || !!resolved} // Disable if already resolved
                style={styles.resolveButton}
              />
            </View>

            {/* Resolved summary - Clearer, more prominent */}
            {!!resolved ? (
              <View
                style={[
                  styles.resolvedSummary,
                  {
                    backgroundColor: successBg,
                    borderColor: successBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resolvedRecipientName,
                    {
                      color: successText,
                    },
                  ]}
                >
                  ✅ Recipient: {resolved.recipient?.username || 'Verified Account'}
                </Text>
                <Text
                  style={[
                    styles.resolvedAccountNumber,
                    { color: textColor },
                  ]}
                >
                  Acct: {resolved.account_number}
                </Text>
                <Text
                  style={[
                    styles.resolvedCurrency,
                    { color: mutedColor },
                  ]}
                >
                  Currency: {(resolved.currency || 'PHP').toUpperCase()}
                </Text>
              </View>
            ) : recipient.trim() && canResolve && !busy && (
              <View
                style={[
                  styles.resolvedSummary,
                  {
                    backgroundColor: colors.surface,
                    borderColor: borderColor,
                  },
                ]}
              >
                <Text
                  style={{
                    color: mutedColor,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  Click "Resolve" to verify recipient details.
                </Text>
              </View>
            )}

            {/* Amount Input */}
            <Input
              placeholder="0.00"
              label={`Amount (${from?.currency || 'PHP'})`}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: textColor }]}
              subText={
                !resolved
                  ? 'Please resolve the recipient first.'
                  : !isBalanceSufficient
                  ? `Insufficient balance. Max: ${formatMoney(
                      from?.balance,
                      from?.currency
                    )}`
                  : ''
              }
              subTextStyle={{
                color: !isBalanceSufficient ? errorColor : mutedColor,
              }}
              disabled={!resolved}
            />

            {/* Quick amount chips - Enhanced pressable state */}
            {!!from && !!resolved && (
              <View
                style={styles.quickAmountChips}
              >
                {[100, 500, 1000, 5000].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => handleAmountChange(String(v))}
                    style={({ pressed }) => [
                      styles.quickAmountChip,
                      {
                        borderColor: borderColor,
                        backgroundColor: pressed
                          ? primaryColor + '25'
                          : cardColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        {
                          color: textColor,
                        },
                      ]}
                    >
                      {formatMoney(v, from.currency)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Remarks */}
            <Input
              placeholder="E.g., Dinner fund, Loan repayment"
              label="Remarks (Optional)"
              value={remarks}
              onChangeText={setRemarks}
            />

            {/* Review button - More spacing */}
            <Button
              title="Review & Confirm Transfer"
              onPress={openConfirm}
              disabled={!canSubmit} // Use canSubmit for consistency
              style={styles.confirmButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <AccountPickerModal />
      <ConfirmModal />

      <ToastComponent
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onDismiss={dismissToast}
        colors={colors}
      />
    </View>
  );
}

// --- StyleSheet (New for cleaner structure)
const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40, // Extra padding for better scrolling behavior
  },
  mainCard: {
    padding: 24, // Increased padding
    borderRadius: 20, // More rounded corners
    gap: 22, // Increased overall spacing
    // Add a subtle shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 24,
    alignSelf: 'center',
    marginBottom: 4,
  },
  divider: {
    height: 1,
  },

  // Account Select
  accountSelect: {
    borderWidth: 1.5, // Slightly thicker border
    paddingHorizontal: 16,
    paddingVertical: 18, // Increased vertical padding
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  accountNumber: {
    fontWeight: '700',
    fontSize: 17, // Slightly larger font
  },
  accountBalance: {
    marginTop: 2,
    fontWeight: '500',
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Recipient Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeToggleItem: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14, // Increased padding
  },
  modeToggleText: {
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 14,
  },

  // Recipient Input Group
  recipientInputGroup: {
    flexDirection: 'row',
    gap: 12, // Increased gap
    alignItems: 'center',
  },
  resolveButton: {
    minWidth: 90,
    height: 50, // Match input height
  },

  // Resolved Summary
  resolvedSummary: {
    borderWidth: 1,
    padding: 18, // Increased padding
    borderRadius: 14,
  },
  resolvedRecipientName: {
    fontWeight: '800',
    marginBottom: 6,
    fontSize: 16,
  },
  resolvedAccountNumber: {
    fontWeight: '600',
    fontSize: 15,
  },
  resolvedCurrency: {
    fontSize: 13,
    marginTop: 4,
  },

  // Amount Input
  amountInput: {
    fontSize: 32, // Larger amount font
    fontWeight: '900',
    textAlign: 'center', // Center the amount
  },

  // Quick Amount Chips
  quickAmountChips: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  quickAmountChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickAmountText: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Confirm Button
  confirmButton: {
    marginTop: 15, // More spacing
  },

  // Account Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopWidth: 4, // Primary color highlight
    borderTopLeftRadius: 24, // More rounded
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '65%', // Slightly more space
  },
  modalTitle: {
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemAccount: {
    fontWeight: '700',
    fontSize: 16,
  },
  pickerItemBalance: {
    fontWeight: '900',
    fontSize: 16,
  },

  // Confirm Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmModalContent: {
    borderRadius: 18,
    padding: 24,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  detailsSection: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // Lighter border for details
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  detailItemContainer: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailSubValue: {
    fontSize: 13,
    marginTop: 2,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12, // Gap between buttons
  },
});