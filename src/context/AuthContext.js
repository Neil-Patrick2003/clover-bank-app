import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log('AuthContext: Checking for existing token...');
        const token = await AsyncStorage.getItem('token');
        if (token) {
          console.log('AuthContext: Token found, verifying with server...');
          api.defaults.headers.Authorization = `Bearer ${token}`;
          try { 
            const response = await api.get('/auth/me'); // Your Laravel API route
            setUser(response.data);
            console.log('AuthContext: User authenticated successfully');
          }
          catch (error) { 
            console.log('AuthContext: Token invalid, removing...', error.response?.status);
            await AsyncStorage.removeItem('token'); 
          }
        } else {
          console.log('AuthContext: No token found');
        }
      } catch (error) {
        console.error('AuthContext: Error during initialization:', error);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext: Attempting login for:', email);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      console.log('AuthContext: Login response received:', data);
      
      // Check different possible token field names
      const token = data.token || data.access_token || data.auth_token;
      const user = data.user || data.data || data;
      
      if (!token) {
        console.error('AuthContext: No token found in response:', data);
        throw new Error('No authentication token received from server');
      }
      
      console.log('AuthContext: Login successful, storing token');
      
      // Store token
      await AsyncStorage.setItem('token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      // Set user data
      setUser(user);
      console.log('AuthContext: User logged in successfully');
    } catch (error) {
      console.error('AuthContext: Login failed:', error.response?.data || error.message);
      throw error; // Re-throw to handle in UI
    }
  };

  const register = async (username, email, password) => {
    console.log('AuthContext: Attempting registration for:', email);
    try {
      const { data } = await api.post('/auth/register', { 
        name: username, // Laravel validation expects 'name' field
        username, 
        email, 
        password,
        password_confirmation: password // Laravel validation expects password confirmation
      });
      console.log('AuthContext: Registration response received:', data);
      
      // Check different possible token field names
      const token = data.token || data.access_token || data.auth_token;
      const user = data.user || data.data || data;
      
      if (!token) {
        console.error('AuthContext: No token found in response:', data);
        throw new Error('No authentication token received from server');
      }
      
      console.log('AuthContext: Registration successful, storing token');
      
      // Store token
      await AsyncStorage.setItem('token', token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      // Set user data
      setUser(user);
      console.log('AuthContext: User registered successfully');
    } catch (error) {
      console.error('AuthContext: Registration failed:', error.response?.data || error.message);
      throw error; // Re-throw to handle in UI
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logging out user...');
    try { 
      await api.post('/auth/logout'); // Your Laravel API route
    } catch (error) {
      console.log('AuthContext: Logout API call failed, continuing with local cleanup');
    }
    
    // Clear local storage and state
    await AsyncStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
    setUser(null);
    console.log('AuthContext: User logged out successfully');
  };

  const value = useMemo(() => ({ user, login, register, logout, booting }), [user, booting]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
