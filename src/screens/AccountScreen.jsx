import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button } from 'react-native';
import { api } from '../api/client';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function AccountsScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const { data } = await api.get('/accounts');
      setItems(data);
    } catch (e) {
      setErr('Failed to load accounts');
    }
  };

  useEffect(() => { load(); }, []);

  if (!items) return <Loading />;

  return (
    <View style={{ flex:1, padding: 12 }}>
      <Button title="Logout" onPress={logout} />
      {err ? <Text style={{ color:'crimson' }}>{err}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountDetail', { id: item.id })}
            style={{ padding:14, borderWidth:1, borderRadius:8, marginVertical:6 }}
          >
            <Text style={{ fontWeight:'600' }}>{item.account_number}</Text>
            <Text>{item.currency} • Balance: {Number(item.balance).toFixed(2)}</Text>
            <Text>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

