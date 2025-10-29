import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

export default function RequestedAccountsScreen({ route, navigation }) {
  const { applicationId } = route.params; const t = useTheme();
  const [type, setType] = useState('savings'), [currency, setCurrency] = useState('PHP'), [initial, setInitial] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    const { data } = await api.get(`/applications/${applicationId}`);
    setItems(data.requested_accounts || []);
  };
  useEffect(() => { load(); }, [applicationId]);

  const add = async () => {
    await api.post(`/applications/${applicationId}/accounts`, { requested_type:type, currency, initial_deposit:Number(initial || 0) });
    setInitial(''); await load();
  };

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16 }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontWeight:'800', color:t.colors.text }}>Requested Accounts</Text>
        <Input placeholder="Type (savings/current/time_deposit)" value={type} onChangeText={setType} />
        <Input placeholder="Currency (PHP)" value={currency} onChangeText={setCurrency} autoCapitalize="characters" />
        <Input placeholder="Initial deposit" value={initial} onChangeText={setInitial} keyboardType="decimal-pad" />
        <Button title="Add" onPress={add} />
        <FlatList
          style={{ marginTop:8 }}
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (<Text>• {item.requested_type} • {item.currency} • {Number(item.initial_deposit).toFixed(2)}</Text>)}
        />
        <Button title="Review & Submit" onPress={() => navigation.navigate('ReviewAndSubmit', { applicationId })} />
      </Card>
    </View>
  );
}
