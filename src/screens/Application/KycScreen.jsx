import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button, Input } from '../../components/ui';

export default function KycScreen({ route, navigation }) {
  const { applicationId } = route.params; const t = useTheme();
  const [kycLevel, setKycLevel] = useState('basic');
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState(''); const [idExpiry, setIdExpiry] = useState('');
  const [msg, setMsg] = useState('');

  const save = async () => {
    setMsg('');
    try {
      await api.post('/applications/kyc', { kyc_level:kycLevel, id_type:idType, id_number:idNumber, id_expiry:idExpiry || null });
      navigation.navigate('RequestedAccounts', { applicationId });
    } catch (e) { setMsg('❌ ' + (e?.response?.data?.message || 'Failed to save KYC')); }
  };

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16 }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontWeight:'800', color:t.colors.text }}>KYC</Text>
        <Input placeholder="KYC level (basic/standard/enhanced)" value={kycLevel} onChangeText={setKycLevel} />
        <Input placeholder="ID type (passport, national_id...)" value={idType} onChangeText={setIdType} />
        <Input placeholder="ID number" value={idNumber} onChangeText={setIdNumber} />
        <Input placeholder="ID expiry (YYYY-MM-DD, optional)" value={idExpiry} onChangeText={setIdExpiry} />
        <Button title="Continue" onPress={save} />
        {msg ? <Text>{msg}</Text> : null}
      </Card>
    </View>
  );
}
