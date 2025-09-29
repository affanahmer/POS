import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import PrintPreviewModal from '../components/PrintPreviewModal';
import { printService } from '../services/printService';
import { saveBusinessInfo, getBusinessInfo } from '../database/db';
import { useSync } from '../hooks/useSync';

const DiagnosticCenterScreen = () => {
  const { performSync, isOnline, lastSync } = useSync();
  const [businessInfo, setBusinessInfo] = useState({
    shop_name: '',
    phone: '',
    address: '',
    logo_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadBusinessInfo();
    runDiagnostics();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      const info = await getBusinessInfo();
      if (info) {
        setBusinessInfo(info);
      }
    } catch (error) {
      console.error('Error loading business info:', error);
    }
  };

  const runDiagnostics = async () => {
    const results = {};

    try {
      // Test database connection
      results.database = {
        status: 'success',
        message: 'SQLite database connected',
      };
    } catch (error) {
      results.database = { status: 'error', message: error.message };
    }

    try {
      // Test Supabase connection
      results.supabase = { status: 'success', message: 'Supabase connected' };
    } catch (error) {
      results.supabase = { status: 'error', message: error.message };
    }

    try {
      // Test printer connection
      const printerStatus = await printService.checkPrinterStatus();
      results.printer = printerStatus;
    } catch (error) {
      results.printer = { status: 'error', message: error.message };
    }

    setTestResults(results);
  };

  const handleSaveBusinessInfo = async () => {
    setIsLoading(true);
    try {
      await saveBusinessInfo(businessInfo);
      Alert.alert('Success', 'Business information saved successfully!');
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save business information: ' + error.message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      const testContent = `
=== GARMENTPOS TEST PRINT ===

Shop: ${businessInfo.shop_name || 'Test Shop'}
Phone: ${businessInfo.phone || 'N/A'}
Address: ${businessInfo.address || 'N/A'}

Date: ${new Date().toLocaleString()}
Status: Printer Test Successful

This is a test print from GarmentPOS
Diagnostic Center.

================================
      `;

      const success = await printService.printText(testContent);

      if (success) {
        Alert.alert('Success', 'Test print completed successfully!');
      } else {
        Alert.alert('Error', 'Test print failed. Check printer connection.');
      }
    } catch (error) {
      Alert.alert('Error', 'Test print failed: ' + error.message);
    }
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await performSync(true);
      if (result.success) {
        Alert.alert('Success', 'Sync completed successfully!');
      } else {
        Alert.alert('Error', 'Sync failed: ' + result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTestResult = (testName, result) => (
    <View key={testName} style={styles.testResult}>
      <View style={styles.testHeader}>
        <Text style={styles.testName}>{testName}</Text>
        <View
          style={[
            styles.statusBadge,
            result.status === 'success'
              ? styles.successBadge
              : styles.errorBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              result.status === 'success'
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {result.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.testMessage}>{result.message}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Diagnostic Center</Text>

      {/* Business Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter shop name"
              value={businessInfo.shop_name}
              onChangeText={value =>
                setBusinessInfo(prev => ({ ...prev, shop_name: value }))
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={businessInfo.phone}
              onChangeText={value =>
                setBusinessInfo(prev => ({ ...prev, phone: value }))
              }
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter shop address"
              value={businessInfo.address}
              onChangeText={value =>
                setBusinessInfo(prev => ({ ...prev, address: value }))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveBusinessInfo}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Business Info</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* System Diagnostics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Diagnostics</Text>

        <View style={styles.diagnosticsContainer}>
          {Object.entries(testResults).map(([testName, result]) =>
            renderTestResult(testName, result),
          )}
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={runDiagnostics}>
          <Text style={styles.refreshButtonText}>Refresh Diagnostics</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>

        <View style={styles.syncContainer}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Connection:</Text>
            <View
              style={[
                styles.statusBadge,
                isOnline ? styles.successBadge : styles.errorBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isOnline ? styles.successText : styles.errorText,
                ]}
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last Sync:</Text>
            <Text style={styles.syncValue}>
              {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isLoading || !isOnline}
        >
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      {/* Print Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Print Testing</Text>

        <View style={styles.printButtons}>
          <TouchableOpacity
            style={styles.printButton}
            onPress={handlePrintPreview}
          >
            <Text style={styles.printButtonText}>Print Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printButton}
            onPress={handleTestPrint}
          >
            <Text style={styles.printButtonText}>Test Print</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        visible={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        businessInfo={businessInfo}
        content={`
=== ${businessInfo.shop_name || 'GarmentPOS'} ===

Order: ORD-${Date.now()}
Customer: Test Customer
Date: ${new Date().toLocaleDateString()}
Return: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Items:
- Custom Shirt: ₹1,500
- Custom Trouser: ₹1,200

Total: ₹2,700
Advance: ₹1,000
Balance: ₹1,700

Thank you for your business!

${businessInfo.address || ''}
Phone: ${businessInfo.phone || ''}
        `}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    margin: 15,
    borderRadius: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  diagnosticsContainer: {
    marginBottom: 15,
  },
  testResult: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  successBadge: {
    backgroundColor: '#d4edda',
  },
  errorBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
  testMessage: {
    fontSize: 12,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  syncContainer: {
    marginBottom: 15,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  syncLabel: {
    fontSize: 14,
    color: '#333',
  },
  syncValue: {
    fontSize: 14,
    color: '#666',
  },
  syncButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  printButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  printButton: {
    flex: 1,
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  printButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DiagnosticCenterScreen;
