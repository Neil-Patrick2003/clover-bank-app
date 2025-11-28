// src/api/api.js
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiBase = () => {
  if (Platform.OS === 'web')     return 'https://clover-bank.on-forge.com/api/v1';
  if (Platform.OS === 'android') return 'https://clover-bank.on-forge.com/api/v1';
  return 'https://clover-bank.on-forge.com/api/v1'; 
}; 

export const api = axios.create({
  baseURL: getApiBase(),
  timeout: 15000,
  headers: { Accept: 'application/json' },
});


// 🔒 Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ⚠️ Optional: Log API errors globally (during dev)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);