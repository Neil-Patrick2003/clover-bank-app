import React, { useContext, useState } from 'react';
import { View, Text } from 'react-native';
import { Input, Button, Card } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const t = useTheme(); const { register } = useContext(AuthContext);
  const [username, setUsername] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [msg, setMsg] = useState('');

  const submit = async () => {
    setMsg('');
    try { await register(username.trim(), email.trim(), password); }
    catch (e) {
      const m = e?.response?.data?.message || (e?.response?.data?.errors ? JSON.stringify(e.response.data.errors) : 'Register failed');
      setMsg(m);
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:t.colors.bg, padding:16, justifyContent:'center' }}>
      <Card style={{ gap:10 }}>
        <Text style={{ fontSize:20, fontWeight:'800', color:t.colors.text }}>Create account</Text>
        <Input placeholder="Username" value={username} onChangeText={setUsername} />
        <Input placeholder="Email" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Register" onPress={submit} />
        {msg ? <Text style={{ color:'#b91c1c' }}>{msg}</Text> : null}
        <Button title="Back to Login" variant="ghost" onPress={() => navigation.goBack()} />
      </Card>
    </View>
  );
}
