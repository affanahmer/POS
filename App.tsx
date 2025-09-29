/**
 * GarmentPOS - React Native App
 * Offline-first POS system for garment stores
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import NewOrderScreen from './src/screens/NewOrderScreen';
import OrdersListScreen from './src/screens/OrdersListScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DiagnosticCenterScreen from './src/screens/DiagnosticCenterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ThemeSettingsScreen from './src/screens/ThemeSettingsScreen';

// Import services
import { authService } from './src/services/authService';
import { initDatabase } from './src/database/db';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = await authService.isAuthenticated();
      setIsAuthenticated(isAuth);
    };

    // Check auth status immediately and then every 2 seconds
    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing GarmentPOS app...');

      // Initialize SQLite database
      console.log('Initializing database...');
      await initDatabase();
      console.log('Database initialized successfully');

      // Check authentication status
      console.log('Checking authentication...');
      const isAuth = await authService.isAuthenticated();
      console.log('Authentication status:', isAuth);
      setIsAuthenticated(isAuth);
    } catch (error) {
      console.error('App initialization error:', error);
      setInitError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Text style={styles.loadingTitle}>GarmentPOS</Text>
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Error screen
  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Text style={styles.errorTitle}>GarmentPOS</Text>
          <Text style={styles.errorText}>Initialization Error</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

      return (
        <ThemeProvider>
          <SafeAreaProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#2196F3',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
          {isAuthenticated ? (
            // Authenticated screens
            <>
              <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'GarmentPOS Dashboard' }}
              />
              <Stack.Screen
                name="NewOrder"
                component={NewOrderScreen}
                options={{ title: 'New Order' }}
              />
              <Stack.Screen
                name="OrdersList"
                component={OrdersListScreen}
                options={{ title: 'Orders' }}
              />
              <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{ title: 'Order Details' }}
              />
              <Stack.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{ title: 'Analytics' }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
              />
              <Stack.Screen
                name="DiagnosticCenter"
                component={DiagnosticCenterScreen}
                options={{ title: 'Diagnostic Center' }}
              />
                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Settings' }}
                  />
                  <Stack.Screen
                    name="ThemeSettings"
                    component={ThemeSettingsScreen}
                    options={{ title: 'Theme Settings' }}
                  />
                </>
              ) : (
            // Authentication screen
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'GarmentPOS Login',
                headerShown: false,
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  </ThemeProvider>
);
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
