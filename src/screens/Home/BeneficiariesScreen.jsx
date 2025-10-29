import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Input, Button } from '../../components/ui';

export default function BeneficiariesScreen() {
  const t = useTheme();
  const [items, setItems] = useState([]), [name, setName] = useState(''), [bank, setBank] = useState(''), [acc, setAcc] = useState(''), [currency, setCurrency] = useState('PHP');
  const [msg, setMsg] = useState('');

  const load = async () => { setItems((await api.get('/beneficiaries')).data); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setMsg(''); try { await api.post('/beneficiaries', { name, bank, account_number:acc, currency }); await load(); setName(''); setBank(''); setAcc(''); setMsg('✅ Added'); }
    catch (e) { setMsg('❌ ' + (e?.response?.data?.message || 'Failed')); }
  };

  const del = async (id) => { setMsg(''); try { await api.delete(`/beneficiaries/${id}`); await load(); setMsg('✅ Deleted'); } catch (e) { setMsg('❌ ' + (e?.response?.data?.message || 'Failed')); } };

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16, gap:12 }}>
      <Card>
        <Text style={{ fontWeight:'800', color:t.colors.text, marginBottom:8 }}>Your Beneficiaries</Text>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <View style={{ paddingVertical:8, borderBottomWidth:0.5, borderBottomColor:'#eee' }}>
              <Text>{item.name} • {item.bank}</Text>
              <Text style={{ color:t.colors.sub }}>{item.account_number} • {item.currency}</Text>
              <TouchableOpacity onPress={() => del(item.id)}><Text style={{ color:'#b91c1c', marginTop:4 }}>Delete</Text></TouchableOpacity>
            </View>
          )}
        />
      </Card>

      <Card style={{ gap:10 }}>
        <Text style={{ fontWeight:'800', color:t.colors.text }}>Add new</Text>
        <Input placeholder="Name" value={name} onChangeText={setName} />
        <Input placeholder="Bank" value={bank} onChangeText={setBank} />
        <Input placeholder="Account number" value={acc} onChangeText={setAcc} />
        <Input placeholder="Currency" value={currency} onChangeText={setCurrency} autoCapitalize="characters" />
        <Button title="Add" onPress={add} />
        {msg ? <Text style={{ marginTop:6, color: msg.startsWith('✅') ? t.colors.primary : '#b91c1c' }}>{msg}</Text> : null}
      </Card>
    </View>
  );
}
