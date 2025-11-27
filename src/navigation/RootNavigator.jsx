import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

import BrandLogo from '../components/BrandLogo';
import BootstrapScreen from '../screens/BootstrapScreen';

// Auth
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import WaitingReviewScreen from '../screens/WaitingReviewScreen';

// Profile
import ProfileScreen from '../screens/Home/ProfileScreen';

// Wizard
import CreateApplicationScreen from '../screens/Application/CreateApplicationScreen';
import KycScreen from '../screens/Application/KycScreen';
import RequestedAccountsScreen from '../screens/Application/RequestedAccountsScreen';
import ReviewAndSubmitScreen from '../screens/Application/ReviewAndSubmitScreen';

// Home
import DashboardScreen from '../screens/Home/Dashboard';
import AccountDetailScreen from '../screens/Home/AccountDetailScreen';
import DepositScreen from '../screens/Home/DepositScreen';
import TransferScreen from '../screens/Home/TransferScreen';
import BillersScreen from '../screens/Home/BillersScreen';
import BeneficiariesScreen from '../screens/Home/BeneficiariesScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AppTabs() {
  const t = useTheme();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.sub,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: t.colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map = {
            Dashboard: focused ? 'speedometer' : 'speedometer-outline',
            Deposit: focused ? 'download' : 'download-outline',
            Transfer: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
            Billers: focused ? 'receipt' : 'receipt-outline',
            Beneficiaries: focused ? 'people' : 'people-outline',
          };
          return <Ionicons name={map[route.name]} size={22} color={color} />;
        },
        tabBarLabelStyle: { fontWeight: '700' },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Deposit" component={DepositScreen} />
      <Tabs.Screen name="Transfer" component={TransferScreen} />
      <Tabs.Screen name="Billers" component={BillersScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting } = useContext(AuthContext);
  const t = useTheme();
  if (booting) return null;

  // Bridge your ThemeProvider to React Navigation theme (keeps colors consistent)
  const navTheme = {
    ...(t.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(t.isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: t.colors.primary,
      background: t.colors.bg,
      text: t.colors.text,
      border: t.colors.border,
      card: t.colors.card ?? '#fff',
      notification: t.colors.primary,
    },
  };

  const getHeaderOptions = (navigation) => ({
    headerStyle: { backgroundColor: '#fff' },
    headerTitleAlign: 'left',
    headerTitle: () => <BrandLogo />,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerRight: () => (
      <Ionicons
        name="person-circle-outline"
        size={24}
        color="#065f46"
        style={{ marginRight: 12 }}
        onPress={() => navigation.navigate('Profile')}
      />
    ),
  });

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={({ navigation }) => getHeaderOptions(navigation)}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerTitle: () => <BrandLogo />, title: 'Sign in' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Create account' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Bootstrap" component={BootstrapScreen} options={{ headerShown: false }} />

            {/* Wizard */}
            <Stack.Screen name="CreateApplication" component={CreateApplicationScreen} options={{ title: 'Start Application' }} />
            <Stack.Screen name="KYC" component={KycScreen} options={{ title: 'KYC Profile' }} />
            <Stack.Screen name="RequestedAccounts" component={RequestedAccountsScreen} options={{ title: 'Requested Accounts' }} />
            <Stack.Screen name="ReviewAndSubmit" component={ReviewAndSubmitScreen} options={{ title: 'Review & Submit' }} />

            {/* Main */}
            <Stack.Screen
              name="Home"
              component={AppTabs}
              options={{ headerShown: true, headerTitle: () => <BrandLogo /> }}
            />
            <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ title: 'Account' }} />
            <Stack.Screen name="WaitingReview" component={WaitingReviewScreen} options={{ title: 'In Review' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
