import React from 'react';
import ThemeProvider from './src/theme/ThemeProvider';
import AuthProvider from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { LogBox } from 'react-native';

// Suppress known warnings
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);


export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );w
}
