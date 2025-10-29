import React from 'react';
import { View, Text } from 'react-native';
import { api } from '../../api/client';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Button } from '../../components/ui';

export default function CreateApplicationScreen({ navigation }) {
  const t = useTheme();
  const start = async () => {
    const { data } = await api.post('/applications', {}); // { id, status:'draft' }
    navigation.navigate('KYC', { applicationId: data.id });
  };
  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16, justifyContent:'center' }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontSize:18, fontWeight:'800', color:t.colors.text }}>Open your account</Text>
        <Text style={{ color:t.colors.sub }}>We’ll collect your KYC details and the accounts you want to open.</Text>
        <Button title="Start" onPress={start} />
      </Card>
    </View>
  );
}
