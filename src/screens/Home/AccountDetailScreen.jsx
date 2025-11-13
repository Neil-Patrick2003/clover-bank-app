import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet, // Added for the new card styles
} from "react-native";
import { api } from "../../api/client";
import { useTheme } from "../../theme/ThemeProvider";
import { Card, Button } from "../../components/ui";
import { Ionicons } from "@expo/vector-icons";


// Define the style sheet for the custom card
const cardStyles = StyleSheet.create({
  detailCard: {
    padding: 0,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 8, // Add spacing below the card
  },
  cardGradientContainer: {
    backgroundColor: '#00B367', // Base green color
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
    padding: 24,
  },
  cardContentWrapper: {
    zIndex: 1,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Faint white bubbles
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLogoPlaceholder: {
    height: 25,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  chipPlaceholder: {
    height: 30,
    width: 40,
    borderRadius: 4,
    backgroundColor: '#FFD700', // Yellow chip
  },
  cardNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 30,
    opacity: 0.95,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    opacity: 0.8,
  },
  primaryBalanceText: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginTop: 4,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-end',
  },
  toggleIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

const AccountDetailCard = ({ account, showBalance, setShowBalance, currencyFormatter }) => {
  const accountType = (account.type || '').toUpperCase();
  const displayBalance = showBalance
    ? currencyFormatter(account.balance, account.currency)
    : "••••••";

  const isZeroOrNegative = Number(account.balance) <= 0;

  return (
    <Card style={cardStyles.detailCard}>
      <View style={cardStyles.cardGradientContainer}>

        {/* Bubble Decorations */}
        <View style={[cardStyles.bubble, { top: -20, left: -30, height: 80, width: 80, opacity: 0.15 }]} />
        <View style={[cardStyles.bubble, { bottom: -10, right: 10, height: 120, width: 120, opacity: 0.1 }]} />
        <View style={[cardStyles.bubble, { top: '30%', left: '40%', height: 50, width: 50, opacity: 0.05 }]} />


        <View style={cardStyles.cardContentWrapper}>
          <View style={cardStyles.cardRow}>
            <View style={cardStyles.bankLogoPlaceholder}>
              <Text style={cardStyles.bankLogoText}>{accountType || 'BANK'}</Text>
            </View>
            <View style={cardStyles.chipPlaceholder} />
          </View>

          <Text style={cardStyles.cardNumber}>
            **** **** **** {String(account.account_number).slice(-4)}
          </Text>

          <View style={[cardStyles.cardRow, { marginTop: 15 }]}>
            <View>
              <Text style={cardStyles.balanceLabel}>Current Balance</Text>
              {isZeroOrNegative && showBalance ? (
                <Text style={cardStyles.primaryBalanceText}>ZERO BALANCE</Text>
              ) : (
                <Text style={cardStyles.primaryBalanceText}>
                  {displayBalance}
                </Text>
              )}
              {/* Optional: Account Alias and Status */}
              <Text style={{ color: 'white', opacity: 0.7, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                {account.alias || account.type} • {account.status.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowBalance(!showBalance)}
              style={cardStyles.toggleButton}
              accessibilityLabel={showBalance ? "Hide balance" : "Show balance"}
            >
              <Text style={cardStyles.toggleIcon}>{showBalance ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );
};

// --- Main Screen Component ---

export default function AccountDetailScreen({ route }) {
  const { id } = route.params;
  const t = useTheme();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  // Helper for formatting currency
  const currencyFormatter = useCallback((amt, currency) => {
    const num = Number(amt) || 0;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [accRes, txRes] = await Promise.all([
        api.get(`/accounts/${id}`),
        api.get(`/accounts/${id}/transactions`, { params: { limit: 50 } }),
      ]);
      setAccount(accRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error("Error loading account details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading && !account) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: t.colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  if (!account) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: t.colors.bg,
        }}
      >
        <Text style={{ color: t.colors.sub }}>Account not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: 16, gap: 16 }}>
      {/* Styled Account Detail Card (Replaces old account info card) */}
      <AccountDetailCard
        account={account}
        showBalance={showBalance}
        setShowBalance={setShowBalance}
        currencyFormatter={currencyFormatter}
      />

      <Button title="Refresh Account Data" onPress={load} />

      {/* Recent Transactions */}
      <Card style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: "800", color: t.colors.text, fontSize: 18 }}>
                Recent Transactions
            </Text>
            {loading && <ActivityIndicator color={t.colors.primary} />}
        </View>


        {transactions.length === 0 ? (
          <Text style={{ color: t.colors.sub, textAlign: "center", marginTop: 20 }}>
            No recent transactions
          </Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(it) => String(it.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: t.colors.border || "#e5e5e5",
                }}
              >
                <Text style={{ fontWeight: "800", color: t.colors.text }}>
                  {item.type.toUpperCase()}
                </Text>
                <Text style={{ color: t.colors.sub, fontSize: 13, marginTop: 2 }}>Ref: {item.reference_no}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: t.colors.sub, fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    <Text 
                        style={{ 
                            fontWeight: "900", 
                            color: Number(item.amount) >= 0 ? (t.colors.success || '#0E7A4D') : (t.colors.danger || '#B3261E') 
                        }}
                    >
                        {currencyFormatter(item.amount, item.currency)}
                    </Text>
                </View>
              </View>
            )}
            ListFooterComponent={<View style={{ height: 10 }} />}
          />
        )}
      </Card>
    </View>
  );
}