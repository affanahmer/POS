import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSync } from '../hooks/useSync';
import { orderService } from '../services/orderService';
import ScrollableContainer from '../components/ScrollableContainer';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { syncStatus, performSync, lastSyncTime } = useSync();
  const { currentTheme, toggleDarkMode, getThemeColors, isDarkMode } =
    useTheme();

  const colors = getThemeColors();

  useEffect(() => {
    // Theme is now managed by ThemeContext
  }, []);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await performSync();
      Alert.alert('Sync Complete', 'Data synchronized successfully!');
    } catch (error) {
      Alert.alert('Sync Error', error.message || 'Failed to sync data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.clearCache();
              Alert.alert('Success', 'Cache cleared successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ],
    );
  };

  const handleResetApp = async () => {
    Alert.alert(
      'Reset App',
      'This will reset all app data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.clearAllData();
              Alert.alert('Success', 'App data reset successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app data');
            }
          },
        },
      ],
    );
  };

  const renderSettingItem = (
    title,
    subtitle,
    onPress,
    rightComponent = null,
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.settingSubtitle, { color: colors.textSecondary }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent || (
        <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>
          ›
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollableContainer
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your GarmentPOS experience
        </Text>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
        >
          Appearance
        </Text>

        {renderSettingItem(
          'Theme Settings',
          'Customize colors and appearance',
          () => navigation.navigate('ThemeSettings'),
        )}

        <View
          style={[styles.settingItem, { borderBottomColor: colors.border }]}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text
              style={[styles.settingSubtitle, { color: colors.textSecondary }]}
            >
              Quick toggle between light and dark themes
            </Text>
          </View>
          <Switch
            value={isDarkMode()}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={isDarkMode() ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Data Management Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
        >
          Data Management
        </Text>

        {renderSettingItem(
          'Sync Data',
          `Last sync: ${lastSyncTime || 'Never'}`,
          handleSync,
          isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.syncStatus, { color: colors.primary }]}>
              {syncStatus}
            </Text>
          ),
        )}

        {renderSettingItem(
          'Analytics',
          'View business reports and insights',
          () => navigation.navigate('Analytics'),
        )}

        {renderSettingItem(
          'Diagnostic Center',
          'Test app functionality and troubleshoot',
          () => navigation.navigate('DiagnosticCenter'),
        )}
      </View>

      {/* Storage Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
        >
          Storage
        </Text>

        {renderSettingItem(
          'Clear Cache',
          'Remove temporary files and cached data',
          handleClearCache,
        )}

        {renderSettingItem(
          'Reset App Data',
          'Clear all orders and settings (Dangerous)',
          handleResetApp,
        )}
      </View>

      {/* App Information Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, borderBottomColor: colors.border },
          ]}
        >
          App Information
        </Text>

        {renderSettingItem(
          'Version',
          '1.0.0',
          null,
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            1.0.0
          </Text>,
        )}

        {renderSettingItem(
          'About GarmentPOS',
          'Learn more about this app',
          () =>
            Alert.alert(
              'About GarmentPOS',
              'GarmentPOS v1.0.0\n\nA comprehensive POS system for garment stores with offline-first capabilities and Supabase integration.',
            ),
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          GarmentPOS - Garment Store Management System
        </Text>
      </View>
    </ScrollableContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  syncStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SettingsScreen;
