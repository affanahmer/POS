import NetInfo from '@react-native-community/netinfo';
import { orderService } from './orderService';
import { createOrder, upsertMeasurements } from './supabase';

// Sync service for GarmentPOS
export const syncService = {
  // Get sync status
  async getSyncStatus() {
    try {
      const networkState = await NetInfo.fetch();
      const pendingRecords = await orderService.getPendingSyncRecords();

      return {
        isOnline: networkState.isConnected && networkState.isInternetReachable,
        pendingCount: pendingRecords.length,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        pendingCount: 0,
        lastSync: null,
      };
    }
  },

  // Sync all pending records
  async syncAll() {
    try {
      const pendingRecords = await orderService.getPendingSyncRecords();
      const results = [];

      for (const record of pendingRecords) {
        try {
          const result = await createOrder(record);
          results.push({ orderId: record.id, status: 'success', data: result });
        } catch (error) {
          results.push({
            orderId: record.id,
            status: 'error',
            error: error.message,
          });
        }
      }

      return {
        success: results.every(r => r.status === 'success'),
        results: { orders: results },
      };
    } catch (error) {
      console.error('Error syncing all:', error);
      return {
        success: false,
        error: error.message,
        results: { orders: [] },
      };
    }
  },

  // Sync with progress callback
  async syncAllWithProgress(onProgress) {
    try {
      const pendingRecords = await orderService.getPendingSyncRecords();
      const results = [];
      const total = pendingRecords.length;

      for (let i = 0; i < pendingRecords.length; i++) {
        const record = pendingRecords[i];

        if (onProgress) {
          onProgress({ current: i + 1, total });
        }

        try {
          const result = await createOrder(record);
          results.push({ orderId: record.id, status: 'success', data: result });
        } catch (error) {
          results.push({
            orderId: record.id,
            status: 'error',
            error: error.message,
          });
        }
      }

      return {
        success: results.every(r => r.status === 'success'),
        results: { orders: results },
      };
    } catch (error) {
      console.error('Error syncing with progress:', error);
      return {
        success: false,
        error: error.message,
        results: { orders: [] },
      };
    }
  },

  // Reset failed syncs
  async resetFailedSyncs() {
    try {
      // This would reset failed sync records to pending
      return { success: true };
    } catch (error) {
      console.error('Error resetting failed syncs:', error);
      throw error;
    }
  },
};
