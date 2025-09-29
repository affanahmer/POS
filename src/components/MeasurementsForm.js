import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ScrollableContainer from './ScrollableContainer';

const MeasurementsForm = ({ data, onChange, errors = {} }) => {
  const [activeTab, setActiveTab] = useState('shirt');

  const handleInputChange = (field, value) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
  };

  const shirtFields = [
    { key: 'shirt_length', label: 'Length (inches)', placeholder: '0.0' },
    { key: 'shoulder', label: 'Shoulder (inches)', placeholder: '0.0' },
    { key: 'arm', label: 'Arm (inches)', placeholder: '0.0' },
    { key: 'chest', label: 'Chest (inches)', placeholder: '0.0' },
    { key: 'shirt_waist', label: 'Waist (inches)', placeholder: '0.0' },
    { key: 'hip', label: 'Hip (inches)', placeholder: '0.0' },
    { key: 'neck', label: 'Neck (inches)', placeholder: '0.0' },
    { key: 'crossback', label: 'Crossback (inches)', placeholder: '0.0' },
  ];

  const trouserFields = [
    { key: 'trouser_length', label: 'Length (inches)', placeholder: '0.0' },
    { key: 'trouser_waist', label: 'Waist (inches)', placeholder: '0.0' },
    { key: 'thigh', label: 'Thigh (inches)', placeholder: '0.0' },
    { key: 'knee', label: 'Knee (inches)', placeholder: '0.0' },
    { key: 'bottom', label: 'Bottom (inches)', placeholder: '0.0' },
  ];

  const renderMeasurementFields = fields => {
    return fields.map(field => (
      <View key={field.key} style={styles.inputContainer}>
        <Text style={styles.label}>{field.label}</Text>
        <TextInput
          style={[styles.input, errors[field.key] && styles.inputError]}
          placeholder={field.placeholder}
          value={data[field.key] ? data[field.key].toString() : ''}
          onChangeText={value => {
            const numericValue = value === '' ? '' : parseFloat(value) || 0;
            handleInputChange(field.key, numericValue);
          }}
          keyboardType="numeric"
          autoCorrect={false}
        />
        {errors[field.key] && (
          <Text style={styles.errorText}>{errors[field.key]}</Text>
        )}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Measurements</Text>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shirt' && styles.activeTab]}
          onPress={() => setActiveTab('shirt')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'shirt' && styles.activeTabText,
            ]}
          >
            Shirt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trouser' && styles.activeTab]}
          onPress={() => setActiveTab('trouser')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'trouser' && styles.activeTabText,
            ]}
          >
            Trouser
          </Text>
        </TouchableOpacity>
      </View>

      {/* Measurement Fields */}
      <ScrollableContainer
        style={styles.scrollContainer}
        contentContainerStyle={styles.fieldsContainer}
      >
        {activeTab === 'shirt' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>Shirt Measurements</Text>
            {renderMeasurementFields(shirtFields)}
          </View>
        )}

        {activeTab === 'trouser' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.groupTitle}>Trouser Measurements</Text>
            {renderMeasurementFields(trouserFields)}
          </View>
        )}
      </ScrollableContainer>

      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          * All measurements are optional. Enter measurements in inches.
        </Text>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 400,
  },
  fieldsContainer: {
    paddingVertical: 10,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 12,
    color: '#f44336',
    marginTop: 5,
  },
  noteContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default MeasurementsForm;
