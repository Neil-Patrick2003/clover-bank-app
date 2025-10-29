import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ScrollView, // Added for filter pills
} from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui';
// Assuming a set of icons is available (e.g., react-native-vector-icons)
// For this example, I'll use placeholders but a real app would import them.
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Account = {
  id: number | string;
  account_number: string;
  balance: number | string;
  currency: string;       // e.g., 'PHP', 'USD'
  status: 'active' | 'inactive' | 'frozen' | 'pending' | string;
  type?: 'savings' | 'checking' | 'time' | string;
  alias?: string;         // optional friendly name
};

type AccountTypeFilter = 'all' | 'savings' | 'checking' | 'time';

export default function DashboardScreen({ navigation }) {
  const t = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountTypeFilter>('all');
  const [showTotals, setShowTotals] = useState(false); // New state for collapsing totals

  const mounted = useRef(true);

  // ---- Helpers -------------------------------------------------------------
  const currencyFormatter = useCallback((amt: number, currency: string) => {
    // Fallback to currency if Intl can’t find it
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amt);
    } catch {
      return `${currency} ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, []);

  const statusChipStyle = useCallback((status: string) => {
    const map: Record<string, { bg: string; fg: string; label: string }> = {
      active:   { bg: t.colors.successBg ?? '#E6F7EE', fg: t.colors.success ?? '#0E7A4D', label: 'Active' },
      pending:  { bg: t.colors.warnBg ?? '#FFF7E6',   fg: t.colors.warn ?? '#A86700',     label: 'Pending' },
      frozen:   { bg: t.colors.dangerBg ?? '#FDECEC', fg: t.colors.danger ?? '#B3261E',   label: 'Frozen'  },
      inactive: { bg: t.colors.mutedBg ?? '#ECEFF3',  fg: t.colors.sub ?? '#566173',      label: 'Inactive'},
    };
    const defaultStyle = { bg: t.colors.mutedBg ?? '#ECEFF3', fg: t.colors.sub ?? '#566173', label: status };
    return map[status.toLowerCase()] ?? defaultStyle;
  }, [t.colors]);
  
  // New helper for account card visual
  const getAccountIconColor = useCallback((type: string) => {
    const map: Record<string, string> = {
      savings: t.colors.primary,
      checking: t.colors.success,
      time: t.colors.warn,
    };
    return map[type.toLowerCase()] ?? t.colors.sub; // Fallback color
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

  // ---- Derived data --------------------------------------------------------
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
      .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0)); // Prioritize active accounts
  }, [accounts, query, typeFilter]);

  const totalBalanceByCurrency = useMemo(() => {
    // Group totals per currency (uses ALL accounts, not just filtered, for a true total view)
    const map = new Map<string, number>();
    for (const a of accounts) {
      const cur = (a.currency || 'PHP').toUpperCase();
      const val = Number(a.balance) || 0;
      map.set(cur, (map.get(cur) ?? 0) + val);
    }
    return Array.from(map.entries()); // [ [ 'PHP', 12345 ], ...]
  }, [accounts]);

  const primaryBalance = totalBalanceByCurrency.length > 0 ? totalBalanceByCurrency[0] : null;

  // ---- UI bits -------------------------------------------------------------
  
  // Custom Screen Header
  const CustomHeader = () => (
    <View style={{
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: t.colors.bg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View>
        <Text style={{ fontSize: 14, color: t.colors.sub }}>Welcome back</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: t.colors.text }}>Your Dashboard</Text>
      </View>
      {/* Placeholder for Avatar/Settings Icon */}
      <View style={{
        height: 40, width: 40, borderRadius: 20,
        backgroundColor: t.colors.primary ?? '#2563eb',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Replace with actual Icon/Image */}
        <Text style={{ color: 'white', fontWeight: 'bold' }}>JD</Text>
      </View>
    </View>
  );

  const Skeleton = () => {
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
      <Card style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 4, height: '100%', borderRadius: 2, backgroundColor: t.colors.skeleton ?? '#e5e7eb', marginRight: 15 }} />
        <Animated.View style={{ opacity: pulse, gap: 10, flex: 1 }}>
          <View style={{ height: 18, width: '70%', borderRadius: 9, backgroundColor: t.colors.skeleton ?? '#e5e7eb' }} />
          <View style={{ height: 14, width: '40%', borderRadius: 7, backgroundColor: t.colors.skeleton ?? '#e5e7eb' }} />
        </Animated.View>
      </Card>
    );
  };

  const ErrorBanner = () => (
    <View style={{ padding: 16, borderRadius: 16, backgroundColor: t.colors.dangerBg ?? '#FDECEC', borderWidth: 1, borderColor: t.colors.danger ?? '#B3261E' }}>
      <Text style={{ color: t.colors.danger ?? '#B3261E', fontWeight: '700', fontSize: 16 }}>Connection Error</Text>
      <Text style={{ color: t.colors.danger ?? '#B3261E', marginTop: 4 }}>{error}</Text>
      <Pressable
        onPress={load}
        accessibilityRole="button"
        style={{ marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: t.colors.danger ?? '#B3261E' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Try Again</Text>
      </Pressable>
    </View>
  );

  const HeaderTotal = () => (
    <Card style={{ backgroundColor: t.colors.primary ?? '#2563eb', padding: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: t.colors.onPrimary ?? '#fff', opacity: 0.8 }}>Total Available Balance</Text>
      {
        primaryBalance ? (
          <View>
            <Text style={{
              fontSize: 32,
              fontWeight: '900',
              color: t.colors.onPrimary ?? '#fff',
              marginTop: 4
            }}>
              {currencyFormatter(primaryBalance[1], primaryBalance[0])}
            </Text>

            {/* Collapsible details for other currencies */}
            {totalBalanceByCurrency.length > 1 && (
              <Pressable onPress={() => setShowTotals(!showTotals)} style={{ marginTop: 10 }}>
                <Text style={{ color: t.colors.onPrimary ?? '#fff', fontWeight: '700', fontSize: 12 }}>
                  {showTotals ? 'Hide other balances' : `+${totalBalanceByCurrency.length - 1} other balance${totalBalanceByCurrency.length > 2 ? 's' : ''}`}
                </Text>
              </Pressable>
            )}

            {/* Expanded currency list */}
            {showTotals && totalBalanceByCurrency
              .filter(([cur]) => cur !== primaryBalance[0])
              .map(([cur, amt]) => (
                <View key={cur} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: t.colors.onPrimary + '40' }}>
                  <Text style={{ color: t.colors.onPrimary ?? '#fff', opacity: 0.8, fontWeight: '600', fontSize: 14 }}>{cur}</Text>
                  <Text style={{ color: t.colors.onPrimary ?? '#fff', fontWeight: '800', fontSize: 16 }}>
                    {currencyFormatter(amt, cur)}
                  </Text>
                </View>
              ))}
          </View>
        ) : (
          <Text style={{ color: t.colors.onPrimary ?? '#fff', marginTop: 6 }}>No balances to show.</Text>
        )
      }
    </Card>
  );

  const FilterPill = ({ label, value }: { label: string; value: AccountTypeFilter }) => {
    const active = typeFilter === value;
    return (
      <Pressable
        onPress={() => setTypeFilter(value)}
        accessibilityRole="button"
        style={{
          paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
          backgroundColor: active ? (t.colors.primary ?? '#2563eb') : (t.colors.surface ?? '#fff'),
          borderWidth: active ? 0 : 1,
          borderColor: t.colors.border ?? '#E5E7EB',
        }}
      >
        <Text style={{
          color: active ? (t.colors.onPrimary ?? '#fff') : (t.colors.text ?? '#111827'),
          fontWeight: active ? '800' : '600',
          fontSize: 14
        }}>{label}</Text>
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: Account }) => {
    const bal = Number(item.balance) || 0;
    const chip = statusChipStyle((item.status ?? '').toLowerCase());
    const cardAccentColor = getAccountIconColor(item.type ?? 'default');
    
    return (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate('AccountDetail', { id: item.id, alias: item.alias || `**** ${String(item.account_number).slice(-4)}` })}
        android_ripple={{ color: '#00000010' }}
        accessibilityRole="button"
      >
        <Card style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}>
          {/* Card Accent / Icon Placeholder */}
          <View style={{ width: 4, height: '100%', position: 'absolute', left: 0, top: 0, backgroundColor: cardAccentColor, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }} />
          
          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.text }} numberOfLines={1}>
                  {item.alias || `**** ${String(item.account_number).slice(-4)}`}
                </Text>
                <Text style={{ marginTop: 2, color: t.colors.sub, fontSize: 13 }}>
                  {(item.type || '').toString().toUpperCase()} • {String(item.account_number)}
                </Text>
              </View>
              {/* Status Chip (smaller) */}
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: chip.bg, alignSelf: 'center' }}>
                <Text style={{ color: chip.fg, fontWeight: '700', fontSize: 11 }}>{chip.label}</Text>
              </View>
            </View>

            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: t.colors.border + '50', paddingTop: 8 }}>
              <Text style={{ color: t.colors.sub, fontWeight: '600' }}>Balance</Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '900',
                  color: bal >= 0 ? (t.colors.text ?? '#111827') : (t.colors.danger ?? '#B3261E')
                }}
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
    <Card style={{ padding: 20, backgroundColor: t.colors.surface ?? '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.text, marginBottom: 8 }}>All Set!</Text>
      <Text style={{ color: t.colors.sub, fontSize: 14 }}>
        It looks like you don’t have any accounts that match your current filters.
      </Text>
      {
        !accounts.length && (
          <>
            <Text style={{ color: t.colors.sub, fontSize: 14, marginTop: 4 }}>
              If you’re ready, you can open a new account below.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('OpenAccount')}
              accessibilityRole="button"
              style={{ marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: t.colors.primary }}
            >
              <Text style={{ color: t.colors.onPrimary ?? '#fff', fontWeight: '800' }}>Open New Account</Text>
            </Pressable>
          </>
        )
      }
      {
        accounts.length > 0 && (
          <Pressable
            onPress={() => { setQuery(''); setTypeFilter('all'); }}
            accessibilityRole="button"
            style={{ marginTop: 16, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: t.colors.chipBg ?? '#eef2f7' }}
          >
            <Text style={{ color: t.colors.text, fontWeight: '700' }}>Clear Filters</Text>
          </Pressable>
        )
      }
    </Card>
  );

  // ---- Render --------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.colors.bg} />
      
      {/* Custom Header */}
      <CustomHeader />
      
      {/* Scrollable Content Area */}
      <View style={{ flex: 1, paddingHorizontal: 20, gap: 16 }}>
        
        {/* Total Balance Card (Always visible and prominent) */}
        {!loading && !error && <HeaderTotal />}

        {/* Search Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: t.colors.border ?? '#E5E7EB',
          backgroundColor: t.colors.surface ?? '#fff',
          borderRadius: 16,
          paddingHorizontal: 12,
        }}>
          {/* Icon Placeholder */}
          <Text style={{ color: t.colors.placeholder ?? '#94a3b8', marginRight: 8, fontSize: 18 }}>🔍</Text> 
          <TextInput
            placeholder="Search by alias, number, currency…"
            placeholderTextColor={t.colors.placeholder ?? '#94a3b8'}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, color: t.colors.text, paddingVertical: 12, fontSize: 15 }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={{ padding: 4 }}>
              {/* Icon Placeholder for Clear */}
              <Text style={{ color: t.colors.placeholder ?? '#94a3b8', fontSize: 18 }}>ⓧ</Text> 
            </Pressable>
          )}
        </View>

        {/* Filters (Horizontal Scroll) */}
        <View style={{ marginBottom: 4 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          >
            <FilterPill label="All Accounts" value="all" />
            <FilterPill label="Savings" value="savings" />
            <FilterPill label="Checking" value="checking" />
            <FilterPill label="Time Deposits" value="time" />
          </ScrollView>
        </View>

        {/* Error */}
        {!!error && <ErrorBanner />}

        {/* List Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.colors.text }}>
            {typeFilter === 'all' ? 'All Accounts' : `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Accounts`}
            {filtered.length > 0 && ` (${filtered.length})`}
          </Text>
          {/* Dedicated Refresh Button */}
          <Pressable
            onPress={onRefresh}
            accessibilityRole="button"
            disabled={refreshing || loading}
            android_ripple={{ color: '#00000010', borderless: true }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={t.colors.primary} />
            ) : (
              <Text style={{ color: t.colors.primary, fontWeight: '700' }}>{loading ? '' : 'Refresh'}</Text>
            )}
            
          </Pressable>
        </View>

        {/* List Content */}
        {loading && !refreshing ? ( // Only show skeleton on initial load, not refresh
          <View style={{ gap: 12 }}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
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
            contentContainerStyle={{ paddingBottom: 30 }} // Extra space at the bottom
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }} // Counteract padding of parent
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}