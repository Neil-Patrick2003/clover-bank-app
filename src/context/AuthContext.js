import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        try { setUser((await api.get('/auth/me')).data); }
        catch { await AsyncStorage.removeItem('token'); }
      }
      setBooting(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout, booting }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
