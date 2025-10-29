import React, { createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { emerald, gray } from './colors';

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }) {
  const theme = {
    colors: { primary: emerald[600], primaryAlt: emerald[700], bg: gray[50], card: '#fff', text: gray[900], sub: gray[600], border: gray[200] },
    radius: 14,
    shadow: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  };
  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style="dark" />
      {children}
    </ThemeContext.Provider>
  );
}
