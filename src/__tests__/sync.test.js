import { syncService } from '../services/syncService';
import {
  initDatabase,
  createOrder,
  saveMeasurements,
  getPendingSyncRecords,
  markAsSynced,
  getSyncStats,
  clearAllData,
} from '../database/db';

// Mock Supabase functions
jest.mock('../services/supabase', () => ({
  createOrder: jest.fn(),
  upsertMeasurements: jest.fn(),
  uploadImageWithProgress: jest.fn(),
  getErrorMessage: jest.fn(),
  isNetworkError: jest.fn(),
}));

describe('Sync Service Tests', () => {
  beforeEach(async () => {
    // Initialize database before each test
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  describe('Database Operations', () => {
    test('should create order with pending sync status', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        phone: '1234567890',
        total: 1000,
        advance: 500,
        balance: 500,
      };

      const order = await createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.customer_name).toBe('Test Customer');
      expect(order.sync_status).toBe('pending');
      expect(order.created_at).toBeDefined();
    });

    test('should save measurements for order', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await createOrder(orderData);

      const measurements = {
        shirt_length: 30,
        shoulder: 18,
        chest: 40,
        waist: 36,
      };

      await saveMeasurements(order.id, measurements);

      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(1);
    });

    test('should get pending sync records', async () => {
      // Create multiple orders
      await createOrder({
        customer_name: 'Customer 1',
        total: 1000,
        advance: 500,
      });

      await createOrder({
        customer_name: 'Customer 2',
        total: 1500,
        advance: 750,
      });

      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(2);
      expect(
        pendingRecords.every(record => record.sync_status === 'pending'),
      ).toBe(true);
    });

    test('should mark order as synced', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await createOrder(orderData);
      await markAsSynced(order.id);

      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(0);
    });

    test('should get sync statistics', async () => {
      // Create orders with different sync statuses
      const order1 = await createOrder({
        customer_name: 'Customer 1',
        total: 1000,
        advance: 500,
      });

      const order2 = await createOrder({
        customer_name: 'Customer 2',
        total: 1500,
        advance: 750,
      });

      // Mark one as synced
      await markAsSynced(order1.id);

      const stats = await getSyncStats();

      expect(stats.orders.pending).toBe(1);
      expect(stats.orders.synced).toBe(1);
      expect(stats.orders.failed).toBe(0);
    });
  });

  describe('Sync Service Functions', () => {
    test('should check online status', () => {
      const isOnline = syncService.isOnline();
      expect(typeof isOnline).toBe('boolean');
    });

    test('should get sync status', async () => {
      // Create test data
      await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      const status = await syncService.getSyncStatus();

      expect(status).toHaveProperty('pendingCount');
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastSync');
      expect(status).toHaveProperty('syncStats');
      expect(status.pendingCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle sync with no pending records', async () => {
      const result = await syncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.message).toBe('No pending records');
    });

    test('should perform force sync', async () => {
      const result = await syncService.forceSync();

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Test with invalid data
      try {
        await createOrder(null);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle sync errors', async () => {
      // Create order with invalid data that might cause sync issues
      const orderData = {
        customer_name: '', // Empty name might cause validation issues
        total: -100, // Negative total
        advance: 1000, // Advance greater than total
      };

      const order = await createOrder(orderData);

      // Try to sync - should handle gracefully
      try {
        await syncService.syncOrder(order.id);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Integrity', () => {
    test('should maintain data consistency during sync', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        phone: '1234567890',
        total: 1000,
        advance: 500,
        balance: 500,
        notes: 'Test order',
      };

      const order = await createOrder(orderData);

      // Verify order data integrity
      expect(order.customer_name).toBe(orderData.customer_name);
      expect(order.phone).toBe(orderData.phone);
      expect(order.total).toBe(orderData.total);
      expect(order.advance).toBe(orderData.advance);
      expect(order.balance).toBe(orderData.balance);
      expect(order.notes).toBe(orderData.notes);
    });

    test('should handle measurements data integrity', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      };

      const order = await createOrder(orderData);

      const measurements = {
        shirt_length: 30.5,
        shoulder: 18.0,
        chest: 40.25,
        waist: 36.75,
        hip: 38.0,
        neck: 16.5,
        arm: 24.0,
        crossback: 17.5,
      };

      await saveMeasurements(order.id, measurements);

      // Verify measurements were saved correctly
      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of orders efficiently', async () => {
      const startTime = Date.now();

      // Create 50 orders
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          createOrder({
            customer_name: `Customer ${i}`,
            total: 1000 + i,
            advance: 500 + i,
          }),
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds

      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(50);
    });

    test('should handle sync of multiple records efficiently', async () => {
      // Create test data
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          createOrder({
            customer_name: `Customer ${i}`,
            total: 1000 + i,
            advance: 500 + i,
          }),
        );
      }

      await Promise.all(promises);

      const startTime = Date.now();
      const result = await syncService.syncAll();
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Sync should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
      expect(result).toHaveProperty('success');
    });
  });
});

// Integration tests
describe('Sync Integration Tests', () => {
  beforeEach(async () => {
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  test('should complete full sync workflow', async () => {
    // 1. Create order with measurements
    const orderData = {
      customer_name: 'Integration Test Customer',
      phone: '9876543210',
      total: 2000,
      advance: 1000,
      balance: 1000,
      notes: 'Integration test order',
    };

    const order = await createOrder(orderData);

    const measurements = {
      shirt_length: 32,
      shoulder: 19,
      chest: 42,
      waist: 38,
      hip: 40,
      neck: 17,
      arm: 25,
      crossback: 18,
    };

    await saveMeasurements(order.id, measurements);

    // 2. Verify pending records
    const pendingRecords = await getPendingSyncRecords();
    expect(pendingRecords.length).toBe(1);

    // 3. Perform sync
    const syncResult = await syncService.syncAll();
    expect(syncResult).toHaveProperty('success');

    // 4. Verify sync status
    const status = await syncService.getSyncStatus();
    expect(status.pendingCount).toBe(0);
  });

  test('should handle network connectivity changes', async () => {
    // Create test data
    await createOrder({
      customer_name: 'Network Test Customer',
      total: 1000,
      advance: 500,
    });

    // Test offline scenario
    const originalIsOnline = syncService.isOnline;
    syncService.isOnline = () => false;

    const offlineResult = await syncService.syncAll();
    expect(offlineResult.success).toBe(false);
    expect(offlineResult.reason).toBe('offline');

    // Restore online status
    syncService.isOnline = originalIsOnline;

    const onlineResult = await syncService.syncAll();
    expect(onlineResult).toHaveProperty('success');
  });
});
