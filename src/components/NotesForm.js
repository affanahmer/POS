import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const NotesForm = ({ data, onChange, errors = {} }) => {
  const handleInputChange = (field, value) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Order Notes</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Special Instructions</Text>
          <TextInput
            style={[styles.textArea, errors.notes && styles.inputError]}
            placeholder="Enter any special instructions, preferences, or notes for this order..."
            value={data.notes}
            onChangeText={value => handleInputChange('notes', value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCorrect={false}
          />
          {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Helpful Tips:</Text>
          <Text style={styles.helpText}>
            • Include fabric preferences{'\n'}• Note any specific styling
            requirements{'\n'}• Mention delivery preferences{'\n'}• Add any
            special occasion details
          </Text>
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
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 5,
  },
  helpContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});

export default NotesForm;
