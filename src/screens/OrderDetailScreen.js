import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getOrderById, getMeasurementsByOrderId } from '../database/db';
import { formatCurrency, formatDate } from '../utils/helpers';
import PrintPreviewModal from '../components/PrintPreviewModal';

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [measurements, setMeasurements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderData, measurementsData] = await Promise.all([
        getOrderById(orderId),
        getMeasurementsByOrderId(orderId),
      ]);

      setOrder(orderData);
      setMeasurements(measurementsData);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('NewOrder', { orderId, editMode: true });
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const generatePrintContent = () => {
    if (!order) return '';

    return `
=== ${order.customer_name || 'Customer'} ===

Order ID: ${order.id}
Date: ${formatDate(order.created_at, 'long')}
Return Date: ${formatDate(order.return_date, 'long')}

Customer Details:
Name: ${order.customer_name}
Phone: ${order.phone || 'N/A'}

Payment Information:
Total Amount: ${formatCurrency(order.total)}
Advance Paid: ${formatCurrency(order.advance)}
Balance Due: ${formatCurrency(order.balance)}

${
  measurements
    ? `
Measurements:
${
  measurements.shirt_length ? `Shirt Length: ${measurements.shirt_length}"` : ''
}
${measurements.shoulder ? `Shoulder: ${measurements.shoulder}"` : ''}
${measurements.arm ? `Arm Length: ${measurements.arm}"` : ''}
${measurements.chest ? `Chest: ${measurements.chest}"` : ''}
${measurements.waist ? `Waist: ${measurements.waist}"` : ''}
${measurements.hip ? `Hip: ${measurements.hip}"` : ''}
${measurements.neck ? `Neck: ${measurements.neck}"` : ''}
${measurements.crossback ? `Crossback: ${measurements.crossback}"` : ''}
${
  measurements.trouser_length
    ? `Trouser Length: ${measurements.trouser_length}"`
    : ''
}
${
  measurements.trouser_waist
    ? `Trouser Waist: ${measurements.trouser_waist}"`
    : ''
}
${measurements.thigh ? `Thigh: ${measurements.thigh}"` : ''}
${measurements.knee ? `Knee: ${measurements.knee}"` : ''}
${measurements.bottom ? `Bottom: ${measurements.bottom}"` : ''}
`
    : ''
}

${
  order.notes
    ? `
Notes:
${order.notes}
`
    : ''
}

Status: ${order.sync_status}
Last Updated: ${formatDate(order.last_updated, 'datetime')}

Thank you for your business!
    `;
  };

  const renderMeasurementSection = (title, fields) => {
    const hasMeasurements = fields.some(
      field => measurements && measurements[field],
    );

    if (!hasMeasurements) return null;

    return (
      <View style={styles.measurementSection}>
        <Text style={styles.measurementTitle}>{title}</Text>
        {fields.map(field => {
          if (measurements && measurements[field]) {
            return (
              <View key={field} style={styles.measurementRow}>
                <Text style={styles.measurementLabel}>
                  {field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())}
                  :
                </Text>
                <Text style={styles.measurementValue}>
                  {measurements[field]}"
                </Text>
              </View>
            );
          }
          return null;
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderId}>{order.id}</Text>
        <View
          style={[
            styles.statusBadge,
            order.sync_status === 'synced'
              ? styles.syncedBadge
              : order.sync_status === 'pending'
              ? styles.pendingBadge
              : styles.failedBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              order.sync_status === 'synced'
                ? styles.syncedText
                : order.sync_status === 'pending'
                ? styles.pendingText
                : styles.failedText,
            ]}
          >
            {order.sync_status}
          </Text>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{order.customer_name}</Text>
        </View>
        {order.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{order.phone}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>
            {formatDate(order.created_at, 'long')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Return Date:</Text>
          <Text style={styles.infoValue}>
            {formatDate(order.return_date, 'long')}
          </Text>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Advance Paid:</Text>
          <Text style={styles.infoValue}>{formatCurrency(order.advance)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Balance Due:</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(order.balance)}
          </Text>
        </View>
      </View>

      {/* Measurements */}
      {measurements && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>

          {renderMeasurementSection('Shirt Measurements', [
            'shirt_length',
            'shoulder',
            'arm',
            'chest',
            'shirt_waist',
            'hip',
            'neck',
            'crossback',
          ])}

          {renderMeasurementSection('Trouser Measurements', [
            'trouser_length',
            'trouser_waist',
            'thigh',
            'knee',
            'bottom',
          ])}
        </View>
      )}

      {/* Notes */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{order.notes}</Text>
        </View>
      )}

      {/* Image */}
      {order.picture_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachment</Text>
          <Image source={{ uri: order.picture_url }} style={styles.image} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.printButtonText}>Print Receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        visible={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        businessInfo={{ shop_name: 'GarmentPOS' }}
        content={generatePrintContent()}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  syncedBadge: {
    backgroundColor: '#d4edda',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  failedBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncedText: {
    color: '#155724',
  },
  pendingText: {
    color: '#856404',
  },
  failedText: {
    color: '#721c24',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
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
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
  measurementSection: {
    marginBottom: 15,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
  },
  measurementValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 20,
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetailScreen;
