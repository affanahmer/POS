import {
  createOrder,
  updateOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  upsertMeasurements,
  getMeasurementsByOrderId,
  uploadImageWithProgress,
} from './supabase';
import {
  createOrder as createLocalOrder,
  updateOrder as updateLocalOrder,
  getOrders as getLocalOrders,
  getOrderById as getLocalOrderById,
  saveMeasurements,
  getMeasurementsByOrderId as getLocalMeasurements,
  saveBusinessInfo,
  getBusinessInfo,
  getDatabaseStats,
  getPendingSyncRecords,
  clearAllData,
} from '../database/db';

// Order service for GarmentPOS
export const orderService = {
  // Create order locally
  async createOrder(orderData) {
    try {
      return await createLocalOrder(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Create order with image upload
  async createOrderWithImage(orderData, measurements, imageUri) {
    try {
      // Create order locally first
      const order = await createLocalOrder(orderData);

      // Upload image if provided
      if (imageUri) {
        const uploadResult = await uploadImageWithProgress(imageUri, order.id);
        if (uploadResult.success) {
          await updateLocalOrder(order.id, {
            picture_url: uploadResult.publicUrl,
          });
          order.picture_url = uploadResult.publicUrl;
        }
      }

      // Save measurements if provided
      if (measurements) {
        await saveMeasurements(order.id, measurements);
      }

      return order;
    } catch (error) {
      console.error('Error creating order with image:', error);
      throw error;
    }
  },

  // Update order
  async updateOrder(orderId, updateData) {
    try {
      return await updateLocalOrder(orderId, updateData);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Get orders
  async getOrders(limit = 50, offset = 0) {
    try {
      return await getLocalOrders(limit, offset);
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  // Get order by ID
  async getOrderById(orderId) {
    try {
      return await getLocalOrderById(orderId);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      throw error;
    }
  },

  // Save measurements
  async saveMeasurements(orderId, measurements) {
    try {
      return await saveMeasurements(orderId, measurements);
    } catch (error) {
      console.error('Error saving measurements:', error);
      throw error;
    }
  },

  // Get measurements by order ID
  async getMeasurementsByOrderId(orderId) {
    try {
      return await getLocalMeasurements(orderId);
    } catch (error) {
      console.error('Error getting measurements:', error);
      throw error;
    }
  },

  // Upload image
  async uploadImage(imageUri, orderId, onProgress) {
    try {
      return await uploadImageWithProgress(imageUri, orderId, onProgress);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Business info operations
  async saveBusinessInfo(businessData) {
    try {
      return await saveBusinessInfo(businessData);
    } catch (error) {
      console.error('Error saving business info:', error);
      throw error;
    }
  },

  async getBusinessInfo() {
    try {
      return await getBusinessInfo();
    } catch (error) {
      console.error('Error getting business info:', error);
      throw error;
    }
  },

  // Database operations
  async getDatabaseStats() {
    try {
      return await getDatabaseStats();
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  },

  async getPendingSyncRecords(limit = 50) {
    try {
      return await getPendingSyncRecords(limit);
    } catch (error) {
      console.error('Error getting pending sync records:', error);
      throw error;
    }
  },

  async clearAllData() {
    try {
      return await clearAllData();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },

  async clearCache() {
    try {
      // Clear any cached data
      return { success: true };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: error.message };
    }
  },
};
