import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { api } from '../api/client';
import { useTheme } from '../theme/ThemeProvider';
import { Card, Button } from '../components/ui';

export default function WaitingReviewScreen({ navigation }) {
  const t = useTheme();

  const checkNow = async () => {
    const { data } = await api.get('/applications/status');
    if ((data.open_accounts ?? 0) > 0) {
      navigation.reset({ index:0, routes:[{ name:'Home' }] });
    }
  };

  useEffect(() => {
    const id = setInterval(checkNow, 5000); // poll softly every 5s
    return () => clearInterval(id);
  }, []);

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16, justifyContent:'center' }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontSize:18, fontWeight:'800', color:t.colors.text }}>Your application is being reviewed</Text>
        <Text style={{ color:t.colors.sub }}>We’ll open your account shortly.</Text>
        <Button title="Refresh" onPress={checkNow} />
      </Card>
    </View>
  );
}
