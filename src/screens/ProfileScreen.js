import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import { getDatabaseStats, clearAllData } from '../database/db';
import { useSync } from '../hooks/useSync';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { performSync, isOnline, lastSync } = useSync();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [userData, databaseStats] = await Promise.all([
        authService.getCurrentUser(),
        getDatabaseStats(),
      ]);

      setUser(userData);
      setStats(databaseStats);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.signOut();
            // Navigation will be handled by App.tsx based on auth state
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out: ' + error.message);
          }
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all local data including orders, measurements, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data cleared successfully');
              loadProfileData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    try {
      const result = await performSync(true);
      if (result.success) {
        Alert.alert('Success', 'Sync completed successfully!');
        loadProfileData();
      } else {
        Alert.alert('Error', 'Sync failed: ' + result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed: ' + error.message);
    }
  };

  const renderInfoRow = (label, value, color = '#333') => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
  );

  const renderActionButton = (
    title,
    onPress,
    color = '#2196F3',
    destructive = false,
  ) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text
        style={[styles.actionButtonText, destructive && styles.destructiveText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        {user && (
          <>
            {renderInfoRow('Username', user.user_metadata?.username || 'admin')}
            {renderInfoRow('Email', user.email || 'admin@garmentpos.com')}
            {renderInfoRow('Role', user.user_metadata?.role || 'admin')}
            {renderInfoRow('User ID', user.id)}
          </>
        )}
      </View>

      {/* App Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Statistics</Text>
        {renderInfoRow('Total Orders', stats.orders?.toString() || '0')}
        {renderInfoRow('Measurements', stats.measurements?.toString() || '0')}
        {renderInfoRow('Pending Sync', stats.pendingSync?.toString() || '0')}
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        {renderInfoRow(
          'Connection',
          isOnline ? 'Online' : 'Offline',
          isOnline ? '#28a745' : '#f44336',
        )}
        {renderInfoRow(
          'Last Sync',
          lastSync ? new Date(lastSync).toLocaleString() : 'Never',
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {renderActionButton('Sync Now', handleSync, '#28a745')}
        {renderActionButton('Refresh Data', loadProfileData, '#17a2b8')}
        {renderActionButton('Clear All Data', handleClearData, '#f44336', true)}
        {renderActionButton('Sign Out', handleSignOut, '#6c757d', true)}
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        {renderInfoRow('App Name', 'GarmentPOS')}
        {renderInfoRow('Version', '1.0.0')}
        {renderInfoRow('Platform', 'React Native')}
        {renderInfoRow('Database', 'SQLite + Supabase')}
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate('DiagnosticCenter')}
        >
          <Text style={styles.helpButtonText}>Diagnostic Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() =>
            Alert.alert(
              'About',
              'GarmentPOS v1.0.0\n\nA comprehensive POS system for garment stores with offline-first capabilities.',
            )
          }
        >
          <Text style={styles.helpButtonText}>About</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: {
    color: '#fff',
  },
  helpButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  helpButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
