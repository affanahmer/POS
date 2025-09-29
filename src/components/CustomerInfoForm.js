import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { validateName, validatePhone } from '../utils/helpers';
import { formatDate } from '../utils/helpers';

const CustomerInfoForm = ({ data, onChange, errors = {} }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleInputChange = (field, value) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('return_date', selectedDate.toISOString());
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'customer_name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      default:
        return { isValid: true };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Customer Information</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={[styles.input, errors.customer_name && styles.inputError]}
            placeholder="Enter customer name"
            value={data.customer_name}
            onChangeText={value => handleInputChange('customer_name', value)}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.customer_name && (
            <Text style={styles.errorText}>{errors.customer_name}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Enter phone number"
            value={data.phone}
            onChangeText={value => handleInputChange('phone', value)}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Return Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(data.return_date, 'long')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(data.return_date)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
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
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomerInfoForm;
