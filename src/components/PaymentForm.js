import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { calculateBalance, formatCurrency } from '../utils/helpers';

const PaymentForm = ({ data, onChange, errors = {} }) => {
  useEffect(() => {
    // Calculate balance whenever total or advance changes
    const balance = calculateBalance(data.total, data.advance);
    if (balance !== data.balance) {
      onChange({ ...data, balance });
    }
  }, [data.total, data.advance]);

  const handleInputChange = (field, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const newData = { ...data, [field]: numericValue };
    onChange(newData);
  };

  const handleSetFullPayment = () => {
    onChange({ ...data, advance: data.total, balance: 0 });
  };

  const handleClearAdvance = () => {
    const balance = calculateBalance(data.total, 0);
    onChange({ ...data, advance: 0, balance });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Payment Information</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Total Amount *</Text>
          <TextInput
            style={[styles.input, errors.total && styles.inputError]}
            placeholder="0.00"
            value={data.total ? data.total.toString() : ''}
            onChangeText={value => handleInputChange('total', value)}
            keyboardType="numeric"
            autoCorrect={false}
          />
          {errors.total && <Text style={styles.errorText}>{errors.total}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Advance Payment</Text>
          <TextInput
            style={[styles.input, errors.advance && styles.inputError]}
            placeholder="0.00"
            value={data.advance ? data.advance.toString() : ''}
            onChangeText={value => handleInputChange('advance', value)}
            keyboardType="numeric"
            autoCorrect={false}
          />
          {errors.advance && (
            <Text style={styles.errorText}>{errors.advance}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSetFullPayment}
          >
            <Text style={styles.actionButtonText}>Full Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAdvance}
          >
            <Text style={styles.actionButtonText}>Clear Advance</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Display */}
        <View style={styles.balanceContainer}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Amount:</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(data.total)}
            </Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Advance Paid:</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(data.advance)}
            </Text>
          </View>
          <View style={[styles.balanceRow, styles.balanceRowTotal]}>
            <Text style={styles.balanceLabelTotal}>Balance Due:</Text>
            <Text style={styles.balanceValueTotal}>
              {formatCurrency(data.balance)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 5,
  },
  quickAmountContainer: {
    marginBottom: 15,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickAmountText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  balanceContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceLabelTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  balanceValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default PaymentForm;
