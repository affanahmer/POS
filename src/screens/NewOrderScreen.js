import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomerInfoForm from '../components/CustomerInfoForm';
import MeasurementsForm from '../components/MeasurementsForm';
import NotesForm from '../components/NotesForm';
import PaymentForm from '../components/PaymentForm';
import AttachmentPicker from '../components/AttachmentPicker';
import { orderService } from '../services/orderService';
import { useSync } from '../hooks/useSync';

const NewOrderScreen = () => {
  const navigation = useNavigation();
  const { performSync } = useSync();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    customer_name: '',
    phone: '',
    return_date: new Date().toISOString(),
    notes: '',
    advance: 0,
    total: 0,
    balance: 0,
    picture_url: '',
  });
  const [measurements, setMeasurements] = useState({});
  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, title: 'Customer Info', component: 'CustomerInfo' },
    { id: 2, title: 'Measurements', component: 'Measurements' },
    { id: 3, title: 'Notes', component: 'Notes' },
    { id: 4, title: 'Payment', component: 'Payment' },
    { id: 5, title: 'Attachments', component: 'Attachments' },
  ];

  useEffect(() => {
    // Auto-set return date to 7 days from now
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 7);
    setOrderData(prev => ({
      ...prev,
      return_date: returnDate.toISOString(),
    }));
  }, []);

  const validateStep = step => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!orderData.customer_name.trim()) {
          newErrors.customer_name = 'Customer name is required';
        }
        break;
      case 2:
        // Measurements are optional, but validate if provided
        break;
      case 3:
        // Notes are optional
        break;
      case 4:
        if (orderData.total <= 0) {
          newErrors.total = 'Total amount must be greater than 0';
        }
        if (orderData.advance > orderData.total) {
          newErrors.advance = 'Advance cannot be greater than total';
        }
        break;
      case 5:
        // Attachments are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSaveOrder();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
    setIsLoading(true);
    try {
      // Prepare order data (db.js will generate the ID)
      const orderToSave = {
        ...orderData,
        sync_status: 'pending',
      };

      // Save order locally
      const order = await orderService.createOrder(orderToSave);
      const orderId = order.id;

      // Save measurements if any
      if (Object.keys(measurements).length > 0) {
        await orderService.saveMeasurements(orderId, measurements);
      }

      // Upload image if provided
      if (orderData.picture_url) {
        try {
          const uploadResult = await orderService.uploadImage(
            orderData.picture_url,
            orderId,
          );
          if (uploadResult.success) {
            await orderService.updateOrder(orderId, {
              picture_url: uploadResult.publicUrl,
            });
          }
        } catch (error) {
          console.log('Image upload failed, but order saved:', error.message);
        }
      }

      Alert.alert('Success', 'Order created successfully!', [
        {
          text: 'View Orders',
          onPress: () => navigation.navigate('OrdersList'),
        },
        {
          text: 'Complete Order',
          onPress: async () => {
            try {
              await orderService.updateOrder(orderId, {
                status: 'completed',
                completed_at: new Date().toISOString(),
                sync_status: 'pending',
              });
              Alert.alert('Success', 'Order marked as completed!', [
                {
                  text: 'View Orders',
                  onPress: () => navigation.navigate('OrdersList'),
                },
                {
                  text: 'New Order',
                  onPress: () => {
                    setCurrentStep(1);
                    setOrderData({
                      customer_name: '',
                      phone: '',
                      return_date: new Date().toISOString(),
                      notes: '',
                      advance: 0,
                      total: 0,
                      balance: 0,
                      picture_url: '',
                    });
                    setMeasurements({});
                    setErrors({});
                  },
                },
              ]);
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to complete order: ' + error.message,
              );
            }
          },
        },
        {
          text: 'New Order',
          onPress: () => {
            setCurrentStep(1);
            setOrderData({
              customer_name: '',
              phone: '',
              return_date: new Date().toISOString(),
              notes: '',
              advance: 0,
              total: 0,
              balance: 0,
              picture_url: '',
            });
            setMeasurements({});
            setErrors({});
          },
        },
      ]);

      // Trigger sync
      performSync();
    } catch (error) {
      Alert.alert('Error', 'Failed to create order: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerInfoForm
            data={orderData}
            onChange={setOrderData}
            errors={errors}
          />
        );
      case 2:
        return (
          <MeasurementsForm
            data={measurements}
            onChange={setMeasurements}
            errors={errors}
          />
        );
      case 3:
        return (
          <NotesForm data={orderData} onChange={setOrderData} errors={errors} />
        );
      case 4:
        return (
          <PaymentForm
            data={orderData}
            onChange={setOrderData}
            errors={errors}
          />
        );
      case 5:
        return (
          <AttachmentPicker
            onImageSelected={imageUri => {
              setOrderData(prev => ({ ...prev, picture_url: imageUri }));
            }}
            currentImage={orderData.picture_url}
            orderId={orderData.id || 'temp'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.header}>
        <Text style={styles.title}>New Order</Text>
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step.id && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= step.id && styles.stepNumberActive,
                  ]}
                >
                  {step.id}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep >= step.id && styles.stepTitleActive,
                ]}
              >
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step.id && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length ? 'Save Order' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepCircleActive: {
    backgroundColor: '#2196F3',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 15,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#e0e0e0',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NewOrderScreen;
