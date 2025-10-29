import React from 'react';
import { View, ScrollView } from 'react-native';
import ThemeProvider from './src/theme/ThemeProvider';
import AuthProvider from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
// import ApiTestComponent from './src/components/ApiTestComponent';

export default function App() {
  
  // const showApiTest = true; // Set to false to use normal app

  // if (showApiTest) {
  //   return (
  //     <ThemeProvider>
  //       <AuthProvider>
  //         <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
  //           <ApiTestComponent />
  //           <View style={{ marginTop: 20 }}>
  //             <RootNavigator />
  //           </View>
  //         </ScrollView>
  //       </AuthProvider>
  //     </ThemeProvider>
  //   );
  // }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
