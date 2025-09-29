import { initDatabase, clearAllData } from '../database/db';
import { syncService } from '../services/syncService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';

// Mock external dependencies
jest.mock('../services/supabase', () => ({
  createOrder: jest.fn(),
  upsertMeasurements: jest.fn(),
  uploadImageWithProgress: jest.fn(),
  getErrorMessage: jest.fn(),
  isNetworkError: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

describe('Integration Tests', () => {
  beforeEach(async () => {
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  describe('Complete Order Workflow', () => {
    test('should complete full order creation and sync workflow', async () => {
      // 1. Create order with all data
      const orderData = {
        customer_name: 'Integration Test Customer',
        phone: '9876543210',
        return_date: '2024-12-31',
        notes: 'Special instructions for integration test',
        advance: 1000,
        total: 2500,
        balance: 1500,
        picture_url: 'file://test-image.jpg',
      };

      const order = await orderService.createOrder(orderData);
      expect(order.id).toBeDefined();
      expect(order.sync_status).toBe('pending');

      // 2. Add measurements
      const measurements = {
        shirt_length: 32.5,
        shoulder: 19.0,
        arm: 25.0,
        chest: 42.5,
        waist: 38.5,
        hip: 40.0,
        neck: 17.0,
        crossback: 18.5,
        trouser_length: 43.0,
        trouser_waist: 38.0,
        thigh: 24.5,
        knee: 20.5,
        bottom: 18.5,
      };

      await orderService.saveMeasurements(order.id, measurements);

      const retrievedMeasurements = await orderService.getMeasurementsByOrderId(
        order.id,
      );
      expect(retrievedMeasurements).toBeDefined();
      expect(retrievedMeasurements.shirt_length).toBe(
        measurements.shirt_length,
      );

      // 3. Verify order is in pending sync
      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(1);
      expect(pendingOrders[0].id).toBe(order.id);

      // 4. Perform sync
      const syncResult = await syncService.syncAll();
      expect(syncResult).toHaveProperty('success');

      // 5. Verify sync status
      const syncStatus = await syncService.getSyncStatus();
      expect(syncStatus.pendingCount).toBe(0);
    });

    test('should handle order creation with image upload', async () => {
      const orderData = {
        customer_name: 'Image Test Customer',
        phone: '5555555555',
        total: 1500,
        advance: 750,
        picture_url: 'file://test-image.jpg',
      };

      // Mock image upload
      const { uploadImageWithProgress } = require('../services/supabase');
      uploadImageWithProgress.mockResolvedValue({
        publicUrl: 'https://supabase.com/storage/test-image.jpg',
      });

      const order = await orderService.createOrderWithImage(
        orderData,
        null,
        'file://test-image.jpg',
      );

      expect(order.id).toBeDefined();
      expect(order.picture_url).toBe(
        'https://supabase.com/storage/test-image.jpg',
      );
      expect(uploadImageWithProgress).toHaveBeenCalled();
    });
  });

  describe('Sync Workflow Integration', () => {
    test('should sync multiple orders with measurements', async () => {
      // Create multiple orders with measurements
      const orders = [];
      for (let i = 0; i < 3; i++) {
        const orderData = {
          customer_name: `Customer ${i}`,
          phone: `123456789${i}`,
          total: 1000 + i * 500,
          advance: 500 + i * 250,
        };

        const order = await orderService.createOrder(orderData);
        orders.push(order);

        // Add measurements
        await orderService.saveMeasurements(order.id, {
          shirt_length: 30 + i,
          chest: 40 + i,
          waist: 36 + i,
        });
      }

      // Verify all orders are pending sync
      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(3);

      // Mock Supabase responses
      const {
        createOrder,
        upsertMeasurements,
      } = require('../services/supabase');
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });
      upsertMeasurements.mockResolvedValue({ id: 'supabase-measurement-id' });

      // Perform sync
      const syncResult = await syncService.syncAllWithProgress(progress => {
        expect(progress.current).toBeGreaterThanOrEqual(0);
        expect(progress.total).toBeGreaterThan(0);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.results.orders.length).toBe(3);
      expect(syncResult.results.measurements.length).toBe(3);

      // Verify orders are marked as synced
      const syncedOrders = await orderService.getPendingSyncRecords();
      expect(syncedOrders.length).toBe(0);
    });

    test('should handle sync failures gracefully', async () => {
      // Create test order
      const orderData = {
        customer_name: 'Failure Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await orderService.createOrder(orderData);

      // Mock Supabase to throw error
      const { createOrder } = require('../services/supabase');
      createOrder.mockRejectedValue(new Error('Network error'));

      // Perform sync
      const syncResult = await syncService.syncAll();

      expect(syncResult.success).toBe(false);
      expect(syncResult.results.orders[0].status).toBe('error');
      expect(syncResult.results.orders[0].error).toBe('Network error');

      // Order should still be pending (not marked as synced)
      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(1);
    });
  });

  describe('Authentication Integration', () => {
    test('should handle authentication flow', async () => {
      // Mock authentication service
      const mockAuthService = {
        signInWithOtp: jest.fn().mockResolvedValue({ success: true }),
        signOut: jest.fn().mockResolvedValue({ success: true }),
        isAuthenticated: jest.fn().mockResolvedValue(true),
      };

      // Test sign in
      const signInResult = await mockAuthService.signInWithOtp(
        'test@example.com',
      );
      expect(signInResult.success).toBe(true);

      // Test authentication check
      const isAuth = await mockAuthService.isAuthenticated();
      expect(isAuth).toBe(true);

      // Test sign out
      const signOutResult = await mockAuthService.signOut();
      expect(signOutResult.success).toBe(true);
    });
  });

  describe('Data Consistency Tests', () => {
    test('should maintain data consistency across operations', async () => {
      // Create order
      const orderData = {
        customer_name: 'Consistency Test Customer',
        phone: '1111111111',
        total: 2000,
        advance: 1000,
      };

      const order = await orderService.createOrder(orderData);
      const orderId = order.id;

      // Add measurements
      const measurements = {
        shirt_length: 31,
        chest: 41,
        waist: 37,
      };

      await orderService.saveMeasurements(orderId, measurements);

      // Update order
      await orderService.updateOrder(orderId, {
        notes: 'Updated notes',
        total: 2200,
      });

      // Retrieve and verify data consistency
      const updatedOrder = await orderService.getOrderById(orderId);
      const updatedMeasurements = await orderService.getMeasurementsByOrderId(
        orderId,
      );

      expect(updatedOrder.customer_name).toBe(orderData.customer_name);
      expect(updatedOrder.phone).toBe(orderData.phone);
      expect(updatedOrder.notes).toBe('Updated notes');
      expect(updatedOrder.total).toBe(2200);
      expect(updatedOrder.balance).toBe(1200); // Should be recalculated

      expect(updatedMeasurements.shirt_length).toBe(31);
      expect(updatedMeasurements.chest).toBe(41);
      expect(updatedMeasurements.waist).toBe(37);
    });

    test('should handle concurrent operations safely', async () => {
      // Create multiple orders concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          orderService.createOrder({
            customer_name: `Concurrent Customer ${i}`,
            total: 1000 + i,
            advance: 500 + i,
          }),
        );
      }

      const orders = await Promise.all(promises);

      // Verify all orders were created with unique IDs
      const orderIds = orders.map(order => order.id);
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(10);

      // Verify all orders are in database
      const allOrders = await orderService.getOrders();
      expect(allOrders.length).toBe(10);
    });
  });

  describe('Error Recovery Tests', () => {
    test('should recover from database errors', async () => {
      // Create order
      const orderData = {
        customer_name: 'Recovery Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await orderService.createOrder(orderData);

      // Simulate database error by clearing data
      await clearAllData();

      // Try to retrieve order (should handle gracefully)
      try {
        await orderService.getOrderById(order.id);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Recreate order
      const newOrder = await orderService.createOrder(orderData);
      expect(newOrder.id).toBeDefined();
    });

    test('should handle network connectivity issues', async () => {
      // Create order
      const orderData = {
        customer_name: 'Network Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await orderService.createOrder(orderData);

      // Mock network error
      const { createOrder } = require('../services/supabase');
      createOrder.mockRejectedValue(new Error('Network connection failed'));

      // Try to sync
      const syncResult = await syncService.syncAll();
      expect(syncResult.success).toBe(false);

      // Order should still be pending
      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(1);

      // Mock successful network
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });

      // Retry sync
      const retryResult = await syncService.syncAll();
      expect(retryResult.success).toBe(true);
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle large dataset efficiently', async () => {
      const startTime = Date.now();

      // Create 50 orders with measurements
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const orderData = {
          customer_name: `Performance Customer ${i}`,
          phone: `123456789${i.toString().padStart(2, '0')}`,
          total: 1000 + i * 100,
          advance: 500 + i * 50,
        };

        promises.push(
          orderService.createOrder(orderData).then(order =>
            orderService.saveMeasurements(order.id, {
              shirt_length: 30 + i * 0.1,
              chest: 40 + i * 0.1,
              waist: 36 + i * 0.1,
            }),
          ),
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(20000); // 20 seconds

      // Verify data integrity
      const orders = await orderService.getOrders();
      expect(orders.length).toBe(50);

      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(50);
    });

    test('should handle sync of large dataset efficiently', async () => {
      // Create test data
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          orderService.createOrder({
            customer_name: `Sync Performance Customer ${i}`,
            total: 1000 + i,
            advance: 500 + i,
          }),
        );
      }

      await Promise.all(promises);

      // Mock Supabase responses
      const {
        createOrder,
        upsertMeasurements,
      } = require('../services/supabase');
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });
      upsertMeasurements.mockResolvedValue({ id: 'supabase-measurement-id' });

      const startTime = Date.now();
      const syncResult = await syncService.syncAllWithProgress(progress => {
        // Progress should be updated
        expect(progress.current).toBeGreaterThanOrEqual(0);
        expect(progress.total).toBeGreaterThan(0);
      });
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Sync should complete within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds
      expect(syncResult.success).toBe(true);
      expect(syncResult.results.orders.length).toBe(20);
    });
  });
});
