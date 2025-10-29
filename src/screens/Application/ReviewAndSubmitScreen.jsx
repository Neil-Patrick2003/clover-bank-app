import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

export default function ReviewAndSubmitScreen({ route, navigation }) {
  const { applicationId } = route.params; const t = useTheme();
  const [app, setApp] = useState(null), [msg, setMsg] = useState('');

  const load = async () => { setApp((await api.get(`/applications/${applicationId}`)).data); };
  useEffect(() => { load(); }, [applicationId]);

  const submit = async () => {
    setMsg(''); try {
      await api.post(`/applications/${applicationId}/submit`);
      setMsg('✅ Submitted. We’ll notify you after review.'); setTimeout(()=> navigation.replace('Home'), 700);
    } catch (e) { setMsg('❌ ' + (e?.response?.data?.message || 'Submit failed')); }
  };

  if (!app) return null;

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16 }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontWeight:'800', color:t.colors.text }}>Review</Text>
        <Text>Status: {app.status}</Text>
        <Text style={{ fontWeight:'600' }}>Requested Accounts</Text>
        {(app.requested_accounts||[]).map(r => (<Text key={r.id}>• {r.requested_type} • {r.currency} • {Number(r.initial_deposit).toFixed(2)}</Text>))}
        <Button title="Submit Application" onPress={submit} />
        {msg ? <Text>{msg}</Text> : null}
      </Card>
    </View>
  );
}
