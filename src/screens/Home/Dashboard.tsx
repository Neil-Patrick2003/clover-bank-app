import React, { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Animated,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext'; 
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui';

type Account = {
  id: number | string;
  account_number: string;
  balance: number | string;
  currency: string;
  status: 'active' | 'inactive' | 'frozen' | 'pending' | string;
  type?: 'savings' | 'checking' | 'time' | string;
  alias?: string;
};

type AccountTypeFilter = 'all' | 'savings' | 'checking' | 'time';

const BankCardTotal = ({ primaryBalance, totalBalanceByCurrency, currencyFormatter, t, accounts }) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isAccountNumberHidden, setIsAccountNumberHidden] = useState(true);
  const [showTotals, setShowTotals] = useState(false); 

  const totalAmount = primaryBalance ? primaryBalance[1] : 0;
  const primaryCurrency = primaryBalance ? primaryBalance[0] : 'PHP';
  const displayAmount = isBalanceHidden ? '******' : currencyFormatter(totalAmount, primaryCurrency);
  const isZeroOrNegative = totalAmount <= 0;

  // Get the first active account's number, or first account if none active
  const primaryAccount = accounts && accounts.length > 0 
    ? accounts.find(a => a.status === 'active') || accounts[0]
    : null;
  const accountNumber = primaryAccount?.account_number || '0000000000000000';
  const fullAccountNumber = String(accountNumber);
  const displayAccountNumber = isAccountNumberHidden 
    ? fullAccountNumber.split('').map(() => '*').join(' ')
    : fullAccountNumber;

  const gradientColors = ['#00B367', '#00CC7A', '#33E699']; 

  return (
    <Card style={cardStyles.totalCard}>
      <View style={[cardStyles.bankCardGradientContainer, {
          backgroundColor: gradientColors[0], 
        }]}>
        
        <View style={[cardStyles.bubble, { top: -20, left: -30, height: 80, width: 80, opacity: 0.15 }]} />
        <View style={[cardStyles.bubble, { bottom: -10, right: 10, height: 120, width: 120, opacity: 0.1 }]} />
        <View style={[cardStyles.bubble, { top: '30%', left: '40%', height: 50, width: 50, opacity: 0.05 }]} />


        <View style={cardStyles.cardContentWrapper}>
            <View style={cardStyles.cardRow}>
              <View style={cardStyles.bankLogoPlaceholder}>
                <Text style={cardStyles.bankLogoText}>BANK</Text>
              </View>
              <View style={cardStyles.chipPlaceholder} />
            </View>

            <View style={[cardStyles.cardRow, { marginTop: 20, marginBottom: 5 }]}>
              <Text style={cardStyles.cardNumber}>
                {displayAccountNumber}
              </Text>
              <Pressable 
                onPress={() => setIsAccountNumberHidden(!isAccountNumberHidden)} 
                style={cardStyles.toggleButton}
                accessibilityLabel={isAccountNumberHidden ? "Show account number" : "Hide account number"}
              >
                <Text style={cardStyles.toggleIcon}>{isAccountNumberHidden ? 'SHOW' : 'HIDE'}</Text>
              </Pressable>
            </View>
            
            <View style={[cardStyles.cardRow, { marginTop: 15 }]}>
              <View>
                <Text style={cardStyles.balanceLabel}>Current Balance</Text>
                {isZeroOrNegative && !isBalanceHidden ? (
                    <Text style={cardStyles.primaryBalanceText}>ZERO BALANCE</Text>
                ) : (
                    <Text style={cardStyles.primaryBalanceText}>
                        {displayAmount}
                    </Text>
                )}
              </View>

              <Pressable 
                onPress={() => setIsBalanceHidden(!isBalanceHidden)} 
                style={cardStyles.toggleButton}
                accessibilityLabel={isBalanceHidden ? "Show balance" : "Hide balance"}
              >
                <Text style={cardStyles.toggleIcon}>{isBalanceHidden ? 'SHOW' : 'HIDE'}</Text>
              </Pressable>
            </View>
        </View>
      </View>

      {totalBalanceByCurrency.length > 1 && totalAmount > 0 && (
        <View style={cardStyles.footerContainer}>
          <Pressable onPress={() => setShowTotals(!showTotals)} style={cardStyles.footerToggle}>
            <Text style={cardStyles.footerToggleText}>
              {showTotals ? 'HIDE SECONDARY BALANCES' : `VIEW +${totalBalanceByCurrency.length - 1} OTHER BALANCE${totalBalanceByCurrency.length > 2 ? 'S' : ''}`}
            </Text>
          </Pressable>

          {showTotals && totalBalanceByCurrency
            .filter(([cur]) => cur !== primaryCurrency)
            .map(([cur, amt]) => (
              <View key={cur} style={cardStyles.secondaryBalanceItem}>
                <Text style={cardStyles.secondaryBalanceCurrency}>{cur}</Text>
                <Text style={cardStyles.secondaryBalanceAmount}>
                  {currencyFormatter(amt, cur)}
                </Text>
              </View>
            ))}
        </View>
      )}
    </Card>
  );
};


export default function DashboardScreen({ navigation }) {
  const t = useTheme();
  const { user, booting } = useContext(AuthContext); 
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>('all');

  const mounted = useRef(true);

  const currencyFormatter = useCallback((amt: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amt);
    } catch {
      return `${currency} ${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, []);

  const statusChipStyle = useCallback((status: string) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      active:   { bg: '#E6F7EE', fg: '#0E7A4D', label: 'Active' },
      pending:  { bg: '#FFF7E6', fg: '#A86700', label: 'Pending' },
      frozen:   { bg: '#FDECEC', fg: '#B3261E', label: 'Frozen'  },
      inactive: { bg: '#ECEFF3', fg: '#566173', label: 'Inactive'},
    };
    const defaultStyle = { bg: '#ECEFF3', fg: '#566173', label: status };
    return map[status.toLowerCase()] ?? defaultStyle;
  }, []);

  const getAccountAccentColor = useCallback((type: string) => {
    const map: Record<string, string> = {
      savings: t.colors.primary,
      checking: t.colors.success,
      time: t.colors.warn,
    };
    return map[type.toLowerCase()] ?? t.colors.sub;
  }, [t.colors]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.get('/accounts');
      if (!mounted.current) return;
      setAccounts(data ?? []);
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || 'Failed to load accounts.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/accounts');
      if (!mounted.current) return;
      setAccounts(data ?? []);
      setError(null);
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || 'Refresh failed.');
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter(a => (typeFilter === 'all' ? true : (a.type ?? '').toLowerCase() === typeFilter))
      .filter(a => {
        if (!q) return true;
        const hay = [
          a.account_number,
          a.alias,
          a.currency,
          a.status,
          a.type,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0));
  }, [accounts, query, typeFilter]);

  const totalBalanceByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      const cur = (a.currency || 'PHP').toUpperCase();
      const val = Number(a.balance) || 0;
      map.set(cur, (map.get(cur) ?? 0) + val);
    }
    return Array.from(map.entries());
  }, [accounts]);

  const primaryBalance = totalBalanceByCurrency.length > 0 ? totalBalanceByCurrency[0] : null;

  const CustomHeader = () => {
    const greetingText = booting 
      ? 'Loading profile...' 
      : 'Welcome back';
        
    const mainTitle = user && user.username 
      ? user.username 
      : 'Your Dashboard';

    const initials = user && user.username 
      ? user.username.charAt(0).toUpperCase() 
      : 'JD';
      
    return (
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerGreeting}>{greetingText}</Text>
          <Text style={styles.headerTitle}>{mainTitle}</Text> 
        </View>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    );
  };

  const SkeletonCard = () => {
    const pulse = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }, [pulse]);
    return (
      <Card style={styles.skeletonCard}>
        <View style={[styles.skeletonAccent, { backgroundColor: t.colors.skeleton ?? '#e5e7eb' }]} />
        <Animated.View style={[{ opacity: pulse, gap: 10, flex: 1, paddingLeft: 10 }]}>
          <View style={[styles.skeletonLine, { width: '70%', height: 18, backgroundColor: t.colors.skeleton ?? '#e5e7eb' }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 14, backgroundColor: t.colors.skeleton ?? '#e5e7eb' }]} />
        </Animated.View>
      </Card>
    );
  };

  const ErrorBanner = () => (
    <View style={styles.errorBanner}>
      <Text style={styles.errorTitle}>Error Loading Data</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Pressable
        onPress={load}
        accessibilityRole="button"
        style={[styles.errorButton, { backgroundColor: t.colors.danger ?? '#B3261E' }]}
      >
        <Text style={styles.errorButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  const FilterPill = ({ label, value }: { label: string; value: AccountTypeFilter }) => {
    const active = typeFilter === value;
    return (
      <Pressable
        onPress={() => setTypeFilter(value)}
        accessibilityRole="button"
        style={[
          styles.filterPillBase,
          active 
            ? { backgroundColor: t.colors.primary ?? '#2563eb' }
            : { backgroundColor: t.colors.surface ?? '#f9fafb', borderWidth: 1, borderColor: t.colors.border ?? '#E5E7EB' }
        ]}
      >
        <Text style={[
          styles.filterPillText,
          { color: active ? t.colors.onPrimary ?? '#fff' : t.colors.text ?? '#111827' }
        ]}>{label}</Text>
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: Account }) => {
    const bal = Number(item.balance) || 0;
    const chip = statusChipStyle((item.status ?? '').toLowerCase());
    const cardAccentColor = getAccountAccentColor(item.type ?? 'default');

    return (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate('AccountDetail', { id: item.id, alias: item.alias || `**** ${String(item.account_number).slice(-4)}` })}
        android_ripple={{ color: '#00000010' }}
        accessibilityRole="button"
      >
        <Card style={styles.accountCard}>
          <View style={[styles.cardAccentLine, { backgroundColor: cardAccentColor }]} />

          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.alias || `**** ${String(item.account_number).slice(-4)}`}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {(item.type || '').toString().toUpperCase()} • {String(item.account_number)}
                </Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                <Text style={[styles.statusChipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterLabel}>Balance</Text>
              <Text
                style={[
                  styles.cardFooterAmount,
                  { color: bal >= 0 ? (t.colors.text ?? '#111827') : (t.colors.danger ?? '#B3261E') }
                ]}
              >
                {currencyFormatter(bal, (item.currency || 'PHP').toUpperCase())}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  const EmptyState = () => (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No Accounts Found</Text>
      <Text style={styles.emptyMessage}>
        It looks like you don’t have any accounts that match your current filters.
      </Text>
      {
        !accounts.length && (
          <>
            <Text style={styles.emptyMessageSub}>
              You can open a new account to get started.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('OpenAccount')}
              accessibilityRole="button"
              style={[styles.emptyButton, { backgroundColor: t.colors.primary }]}
            >
              <Text style={styles.emptyButtonText}>Open New Account</Text>
            </Pressable>
          </>
        )
      }
      {
        accounts.length > 0 && (
          <Pressable
            onPress={() => { setQuery(''); setTypeFilter('all'); }}
            accessibilityRole="button"
            style={[styles.clearFilterButton, { backgroundColor: t.colors.chipBg ?? '#eef2f7' }]}
          >
            <Text style={[styles.clearFilterText, { color: t.colors.text }]}>Clear Filters</Text>
          </Pressable>
        )
      }
    </Card>
  );

  return (
    <View style={styles.fullScreenBackground}>
      <StatusBar barStyle='dark-content' backgroundColor={t.colors.bg} />

      <CustomHeader />

      <View style={styles.contentArea}>

        {!loading && !error && (
            <BankCardTotal 
                primaryBalance={primaryBalance}
                totalBalanceByCurrency={totalBalanceByCurrency}
                currencyFormatter={currencyFormatter}
                t={t}
                accounts={accounts}
            />
        )}

        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by alias, number, currency..."
            placeholderTextColor={t.colors.placeholder ?? '#94a3b8'}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={{ padding: 4 }}>
              <Text style={styles.clearSearchIcon}>ⓧ</Text>
            </Pressable>
          )}
        </View>

        <View style={{ marginBottom: 4 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollView}
          >
            <FilterPill label="All Accounts" value="all" />
            <FilterPill label="Savings" value="savings" />
            <FilterPill label="Checking" value="checking" />
            <FilterPill label="Time Deposits" value="time" />
          </ScrollView>
        </View>

        {!!error && <ErrorBanner />}

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>
            {typeFilter === 'all' ? 'All Accounts' : `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Accounts`}
            {filtered.length > 0 && ` (${filtered.length})`}
          </Text>
          <Pressable
            onPress={onRefresh}
            accessibilityRole="button"
            disabled={refreshing || loading}
            android_ripple={{ color: '#00000010', borderless: true }}
            style={styles.refreshButton}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={t.colors.primary} />
            ) : (
              <Text style={[styles.refreshText, { color: t.colors.primary }]}>{loading ? '' : 'refresh'}</Text>
            )}

          </Pressable>
        </View>

        {loading && !refreshing ? (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={<EmptyState />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.colors.primary}
              />
            }
            contentContainerStyle={styles.flatListContent}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
    totalCard: {
        padding: 0,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    bankCardGradientContainer: {
        backgroundColor: '#00B367', 
        position: 'relative',
        overflow: 'hidden',
        minHeight: 180, 
    },
    cardContentWrapper: {
        padding: 24,
        paddingTop: 30,
        zIndex: 1, 
    },
    bubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'white',
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
        backgroundColor: '#FFD700', 
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
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        marginTop: 4,
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    toggleIcon: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },

    footerContainer: {
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)', 
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    footerToggle: {
        marginBottom: 10,
    },
    footerToggleText: {
        color: 'white', 
        fontWeight: '700', 
        fontSize: 12,
        opacity: 0.8,
    },
    secondaryBalanceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    secondaryBalanceCurrency: { color: 'white', opacity: 0.9, fontWeight: '600', fontSize: 14 },
    secondaryBalanceAmount: { color: 'white', fontWeight: '800', fontSize: 16 },
});


const styles = StyleSheet.create({
    fullScreenBackground: {
        flex: 1,
        backgroundColor: 'white',
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    headerGreeting: {
        fontSize: 14,
        color: '#566173',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#111827',
    },
    avatarPlaceholder: {
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#00BFFF', fontWeight: 'bold', fontSize: 14 },
    contentArea: { flex: 1, paddingHorizontal: 20, gap: 16, paddingTop: 16 },

    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        color: '#94a3b8',
        marginRight: 8,
        fontSize: 18,
        fontWeight: 'normal',
    },
    searchInput: {
        flex: 1,
        color: '#111827',
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '500'
    },
    clearSearchIcon: { color: '#94a3b8', fontSize: 18, fontWeight: 'normal' },

    filterScrollView: { gap: 8, paddingRight: 20 },
    filterPillBase: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterPillText: {
        fontWeight: '700',
        fontSize: 14
    },

    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    listHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
    refreshText: { fontWeight: '700', fontSize: 14 },

    accountCard: { padding: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f1f1' },
    cardAccentLine: {
        width: 4,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
    cardSubtitle: { marginTop: 2, color: '#566173', fontSize: 13, fontWeight: '500' },
    statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'center' },
    statusChipText: { fontWeight: '700', fontSize: 11 },
    cardFooter: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
        paddingTop: 8
    },
    cardFooterLabel: { color: '#566173', fontWeight: '600', fontSize: 14 },
    cardFooterAmount: { fontSize: 20, fontWeight: '900' },

    skeletonCard: { padding: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb' },
    skeletonAccent: { width: 4, height: '100%', borderRadius: 2, marginRight: 15 },
    skeletonLine: { borderRadius: 9 },

    errorBanner: { padding: 16, borderRadius: 12, backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#B3261E' },
    errorTitle: { color: '#B3261E', fontWeight: '800', fontSize: 16 },
    errorMessage: { color: '#B3261E', marginTop: 4, fontSize: 14 },
    errorButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    errorButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
    emptyCard: { padding: 20, backgroundColor: 'white' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
    emptyMessage: { color: '#566173', fontSize: 14 },
    emptyMessageSub: { color: '#566173', fontSize: 14, marginTop: 4, fontWeight: '600' },
    emptyButton: {
        marginTop: 16,
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyButtonText: { color: 'white', fontWeight: '800' },
    clearFilterButton: {
        marginTop: 16,
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    clearFilterText: { fontWeight: '700' },
    flatListContent: { paddingBottom: 30 },
    flatList: { marginHorizontal: -20, paddingHorizontal: 20 }
});