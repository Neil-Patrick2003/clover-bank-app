import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

export default function AccountDetailScreen({ route }) {
  const { id } = route.params; const t = useTheme();
  const [account, setAccount] = useState(null), [tx, setTx] = useState([]);

  const load = async () => {
    const [a,tq] = await Promise.all([api.get(`/accounts/${id}`), api.get(`/accounts/${id}/transactions`, { params:{ limit:50 } })]);
    setAccount(a.data); setTx(tq.data);
  };
  useEffect(() => { load(); }, [id]);

  if (!account) return null;

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:12, gap:12 }}>
      <Card>
        <Text style={{ fontSize:18, fontWeight:'800', color:t.colors.text }}>{account.account_number}</Text>
        <Text style={{ marginTop:6, color:t.colors.sub }}>{account.currency} • <Text style={{ color:t.colors.primary, fontWeight:'800' }}>{Number(account.balance).toFixed(2)}</Text> • {account.status}</Text>
        <Button style={{ marginTop:10 }} title="Refresh" onPress={load} />
      </Card>

      <Card>
        <Text style={{ fontWeight:'800', color:t.colors.text, marginBottom:8 }}>Recent Transactions</Text>
        <FlatList
          data={tx}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <View style={{ paddingVertical:10, borderBottomWidth:0.5, borderBottomColor:'#eee' }}>
              <Text style={{ fontWeight:'700' }}>{item.type.toUpperCase()} • {item.currency} {Number(item.amount).toFixed(2)}</Text>
              <Text style={{ color:t.colors.sub }}>Ref: {item.reference_no}</Text>
              <Text style={{ color:t.colors.sub }}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />
      </Card>
    </View>
  );
}
