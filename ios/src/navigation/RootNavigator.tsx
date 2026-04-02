import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import MapScreen from '../screens/MapScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { PanelProvider } from '../context/PanelContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Main' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('has_onboarded').then(v => {
      setInitialRoute(v === 'true' ? 'Main' : 'Onboarding');
    }).catch(() => setInitialRoute('Onboarding'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F5F2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#8B4513" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <PanelProvider>
        <AppStatusBar />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MapScreen} />
        </Stack.Navigator>
      </PanelProvider>
    </ThemeProvider>
  );
}
