import React, { useContext, useState } from 'react';
import { View, Text } from 'react-native';
import { Input, Button, Card } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const t = useTheme(); const { login } = useContext(AuthContext);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [msg, setMsg] = useState('');

  const submit = async () => {
    setMsg('');
    try { await login(email.trim(), password); }
    catch (e) { setMsg(e?.response?.data?.message || 'Login failed'); }
  };

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16, justifyContent:'center' }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontSize:20, fontWeight:'800', color:t.colors.text }}>Welcome</Text>
        <Input placeholder="Email" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Sign in" onPress={submit} />
        {msg ? <Text style={{ color:'#b91c1c' }}>{msg}</Text> : null}
        <Button title="Create account" variant="ghost" onPress={() => navigation.navigate('Register')} />
      </Card>
    </View>
  );
}
