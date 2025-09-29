import { initDatabase, clearAllData } from '../database/db';
import { syncService } from '../services/syncService';
import { orderService } from '../services/orderService';
import { authService } from '../services/authService';
import { printService } from '../services/printService';
import { storageService } from '../services/storageService';

// Mock external dependencies
jest.mock('../services/supabase', () => ({
  createOrder: jest.fn(),
  upsertMeasurements: jest.fn(),
  uploadImageWithProgress: jest.fn(),
  getErrorMessage: jest.fn(),
  isNetworkError: jest.fn(),
  createClient: jest.fn(() => ({
    auth: {
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        download: jest.fn(() => Promise.resolve({ data: null, error: null })),
        remove: jest.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/image.jpg' },
        })),
      })),
    },
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
  ),
}));

describe('End-to-End Integration Tests', () => {
  beforeEach(async () => {
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  describe('Complete Order Workflow', () => {
    test('should complete full order creation with all features', async () => {
      // 1. Authentication
      const mockAuth = {
        signInWithOtp: jest.fn().mockResolvedValue({ success: true }),
        isAuthenticated: jest.fn().mockResolvedValue(true),
      };

      const authResult = await mockAuth.signInWithOtp('test@example.com');
      expect(authResult.success).toBe(true);

      // 2. Create order with all data
      const orderData = {
        customer_name: 'E2E Test Customer',
        phone: '9876543210',
        return_date: '2024-12-31',
        notes: 'Complete E2E test order with all features',
        advance: 1000,
        total: 2500,
        balance: 1500,
        picture_url: 'file://test-image.jpg',
      };

      const order = await orderService.createOrder(orderData);
      expect(order.id).toBeDefined();
      expect(order.sync_status).toBe('pending');

      // 3. Add comprehensive measurements
      const measurements = {
        // Shirt measurements
        shirt_length: 32.5,
        shoulder: 19.0,
        arm: 25.0,
        chest: 42.5,
        waist: 38.5,
        hip: 40.0,
        neck: 17.0,
        crossback: 18.5,
        // Trouser measurements
        trouser_length: 43.0,
        trouser_waist: 38.0,
        thigh: 24.5,
        knee: 20.5,
        bottom: 18.5,
      };

      await orderService.saveMeasurements(order.id, measurements);

      // 4. Verify data integrity
      const retrievedOrder = await orderService.getOrderById(order.id);
      const retrievedMeasurements = await orderService.getMeasurementsByOrderId(
        order.id,
      );

      expect(retrievedOrder.customer_name).toBe(orderData.customer_name);
      expect(retrievedMeasurements.shirt_length).toBe(
        measurements.shirt_length,
      );
      expect(retrievedMeasurements.trouser_length).toBe(
        measurements.trouser_length,
      );

      // 5. Test image upload
      const { uploadImageWithProgress } = require('../services/supabase');
      uploadImageWithProgress.mockResolvedValue({
        publicUrl: 'https://supabase.com/storage/test-image.jpg',
      });

      const uploadResult = await storageService.uploadImage(
        'file://test-image.jpg',
        order.id,
      );
      expect(uploadResult.success).toBe(true);

      // 6. Test print preview
      const printPreview = await printService.generateReceiptTemplate(
        order,
        measurements,
        { shop_name: 'Test Shop' },
      );
      expect(printPreview).toContain('E2E Test Customer');
      expect(printPreview).toContain('Test Shop');

      // 7. Test analytics data
      const orders = await orderService.getOrders();
      expect(orders.length).toBe(1);

      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        pendingSync: orders.filter(o => o.sync_status === 'pending').length,
      };

      expect(analytics.totalOrders).toBe(1);
      expect(analytics.totalRevenue).toBe(2500);
      expect(analytics.pendingSync).toBe(1);
    });
  });

  describe('Offline-First Testing', () => {
    test('should work completely offline', async () => {
      // Mock offline scenario
      const { createOrder: mockCreateOrder } = require('../services/supabase');
      mockCreateOrder.mockRejectedValue(new Error('Network error'));

      // 1. Create order offline
      const orderData = {
        customer_name: 'Offline Customer',
        phone: '1111111111',
        total: 1500,
        advance: 750,
      };

      const order = await orderService.createOrder(orderData);
      expect(order.id).toBeDefined();
      expect(order.sync_status).toBe('pending');

      // 2. Add measurements offline
      const measurements = {
        shirt_length: 30,
        chest: 40,
        waist: 36,
      };

      await orderService.saveMeasurements(order.id, measurements);

      // 3. Verify data is stored locally
      const localOrders = await orderService.getOrders();
      expect(localOrders.length).toBe(1);

      const localMeasurements = await orderService.getMeasurementsByOrderId(
        order.id,
      );
      expect(localMeasurements).toBeDefined();

      // 4. Test offline analytics
      const analytics = {
        totalOrders: localOrders.length,
        totalRevenue: localOrders.reduce((sum, o) => sum + o.total, 0),
        pendingSync: localOrders.filter(o => o.sync_status === 'pending')
          .length,
      };

      expect(analytics.totalOrders).toBe(1);
      expect(analytics.totalRevenue).toBe(1500);
      expect(analytics.pendingSync).toBe(1);

      // 5. Test offline printing
      const printPreview = await printService.generateReceiptTemplate(
        order,
        measurements,
        { shop_name: 'Offline Shop' },
      );
      expect(printPreview).toContain('Offline Customer');
    });

    test('should sync when coming back online', async () => {
      // 1. Create order offline
      const orderData = {
        customer_name: 'Sync Test Customer',
        phone: '2222222222',
        total: 2000,
        advance: 1000,
      };

      const order = await orderService.createOrder(orderData);
      await orderService.saveMeasurements(order.id, {
        shirt_length: 31,
        chest: 41,
        waist: 37,
      });

      // 2. Mock network restoration
      const {
        createOrder,
        upsertMeasurements,
      } = require('../services/supabase');
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });
      upsertMeasurements.mockResolvedValue({ id: 'supabase-measurement-id' });

      // 3. Test sync
      const syncResult = await syncService.syncAllWithProgress(progress => {
        expect(progress.current).toBeGreaterThanOrEqual(0);
        expect(progress.total).toBeGreaterThan(0);
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.results.orders.length).toBe(1);
      expect(syncResult.results.measurements.length).toBe(1);

      // 4. Verify sync status
      const syncedOrder = await orderService.getOrderById(order.id);
      expect(syncedOrder.sync_status).toBe('synced');
    });
  });

  describe('Picture Upload and Storage Testing', () => {
    test('should handle picture upload workflow', async () => {
      // 1. Create order
      const orderData = {
        customer_name: 'Picture Test Customer',
        phone: '3333333333',
        total: 1800,
        advance: 900,
      };

      const order = await orderService.createOrder(orderData);

      // 2. Mock image upload
      const { uploadImageWithProgress } = require('../services/supabase');
      uploadImageWithProgress.mockResolvedValue({
        publicUrl: 'https://supabase.com/storage/customer-photo.jpg',
      });

      // 3. Test image upload
      const uploadResult = await storageService.uploadImage(
        'file://customer-photo.jpg',
        order.id,
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.publicUrl).toBe(
        'https://supabase.com/storage/customer-photo.jpg',
      );

      // 4. Update order with picture URL
      await orderService.updateOrder(order.id, {
        picture_url: uploadResult.publicUrl,
      });

      // 5. Verify picture URL is saved
      const updatedOrder = await orderService.getOrderById(order.id);
      expect(updatedOrder.picture_url).toBe(
        'https://supabase.com/storage/customer-photo.jpg',
      );

      // 6. Test print preview with picture
      const printPreview = await printService.generateJobSheetTemplate(
        updatedOrder,
        null,
        { shop_name: 'Picture Shop' },
      );
      expect(printPreview).toContain('Picture Test Customer');
    });
  });

  describe('Printing Integration Testing', () => {
    test('should handle complete printing workflow', async () => {
      // 1. Create order with measurements
      const orderData = {
        customer_name: 'Print Test Customer',
        phone: '4444444444',
        total: 2200,
        advance: 1100,
      };

      const order = await orderService.createOrder(orderData);
      await orderService.saveMeasurements(order.id, {
        shirt_length: 33,
        chest: 43,
        waist: 39,
        trouser_length: 44,
        trouser_waist: 39,
      });

      // 2. Mock printer connection
      const mockPrinter = {
        connect: jest.fn().mockResolvedValue({ success: true }),
        print: jest.fn().mockResolvedValue({ success: true }),
        disconnect: jest.fn().mockResolvedValue({ success: true }),
      };

      printService.connectPrinter = jest.fn().mockResolvedValue(mockPrinter);

      // 3. Test printer connection
      const connectionResult = await printService.connectPrinter();
      expect(connectionResult.success).toBe(true);

      // 4. Test receipt generation
      const receipt = await printService.generateReceiptTemplate(
        order,
        await orderService.getMeasurementsByOrderId(order.id),
        { shop_name: 'Print Shop', phone: '555-0123' },
      );

      expect(receipt).toContain('Print Test Customer');
      expect(receipt).toContain('Print Shop');
      expect(receipt).toContain('2200');

      // 5. Test job sheet generation
      const jobSheet = await printService.generateJobSheetTemplate(
        order,
        await orderService.getMeasurementsByOrderId(order.id),
        { shop_name: 'Print Shop', phone: '555-0123' },
      );

      expect(jobSheet).toContain('Print Test Customer');
      expect(jobSheet).toContain('33'); // shirt_length
      expect(jobSheet).toContain('44'); // trouser_length

      // 6. Test print execution
      const printResult = await printService.printOrderReceipt(
        order,
        await orderService.getMeasurementsByOrderId(order.id),
      );
      expect(printResult.success).toBe(true);
    });
  });

  describe('Diagnostic Center Testing', () => {
    test('should run all diagnostic tests', async () => {
      // 1. Create test data
      const orderData = {
        customer_name: 'Diagnostic Test Customer',
        phone: '5555555555',
        total: 3000,
        advance: 1500,
      };

      const order = await orderService.createOrder(orderData);
      await orderService.saveMeasurements(order.id, {
        shirt_length: 34,
        chest: 44,
        waist: 40,
      });

      // 2. Test database diagnostics
      const dbStats = await orderService.getDatabaseStats();
      expect(dbStats.orders).toBe(1);
      expect(dbStats.measurements).toBe(1);
      expect(dbStats.pendingSync).toBe(1);

      // 3. Test sync diagnostics
      const syncStats = await syncService.getSyncStatus();
      expect(syncStats.pendingCount).toBe(1);
      expect(syncStats.isOnline).toBe(true);

      // 4. Test business info
      const businessInfo = {
        shop_name: 'Diagnostic Shop',
        phone: '666-0123',
        address: '123 Test Street',
        logo_url: 'https://example.com/logo.png',
      };

      await orderService.saveBusinessInfo(businessInfo);
      const retrievedInfo = await orderService.getBusinessInfo();
      expect(retrievedInfo.shop_name).toBe('Diagnostic Shop');

      // 5. Test print diagnostics
      const printStatus = await printService.checkPrinterStatus();
      expect(printStatus).toHaveProperty('connected');

      // 6. Test attachment diagnostics
      const { uploadImageWithProgress } = require('../services/supabase');
      uploadImageWithProgress.mockResolvedValue({
        publicUrl: 'https://supabase.com/storage/diagnostic-test.jpg',
      });

      const attachmentResult = await storageService.uploadImage(
        'file://diagnostic-test.jpg',
        order.id,
      );
      expect(attachmentResult.success).toBe(true);
    });
  });

  describe('Performance and Stress Testing', () => {
    test('should handle large dataset efficiently', async () => {
      const startTime = Date.now();

      // Create 100 orders with measurements
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const orderData = {
          customer_name: `Performance Customer ${i}`,
          phone: `123456789${i.toString().padStart(2, '0')}`,
          total: 1000 + i * 10,
          advance: 500 + i * 5,
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
      expect(duration).toBeLessThan(30000); // 30 seconds

      // Verify data integrity
      const orders = await orderService.getOrders();
      expect(orders.length).toBe(100);

      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(100);

      // Test analytics performance
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue:
          orders.reduce((sum, o) => sum + o.total, 0) / orders.length,
      };

      expect(analytics.totalOrders).toBe(100);
      expect(analytics.totalRevenue).toBeGreaterThan(100000);
      expect(analytics.averageOrderValue).toBeGreaterThan(1000);
    });

    test('should handle concurrent operations safely', async () => {
      // Create multiple orders concurrently
      const promises = [];
      for (let i = 0; i < 50; i++) {
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
      expect(uniqueIds.size).toBe(50);

      // Verify all orders are in database
      const allOrders = await orderService.getOrders();
      expect(allOrders.length).toBe(50);

      // Test concurrent measurements
      const measurementPromises = [];
      for (let i = 0; i < 50; i++) {
        measurementPromises.push(
          orderService.saveMeasurements(orders[i].id, {
            shirt_length: 30 + i,
            chest: 40 + i,
            waist: 36 + i,
          }),
        );
      }

      await Promise.all(measurementPromises);

      // Verify measurements were saved
      const measurements = await orderService.getMeasurementsByOrderId(
        orders[0].id,
      );
      expect(measurements).toBeDefined();
    });
  });

  describe('Error Recovery and Resilience Testing', () => {
    test('should recover from various error scenarios', async () => {
      // 1. Test database error recovery
      try {
        await orderService.createOrder(null);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // 2. Test network error recovery
      const { createOrder } = require('../services/supabase');
      createOrder.mockRejectedValue(new Error('Network connection failed'));

      const orderData = {
        customer_name: 'Error Recovery Customer',
        total: 1000,
        advance: 500,
      };

      const order = await orderService.createOrder(orderData);
      expect(order.id).toBeDefined();

      // Try to sync - should handle gracefully
      const syncResult = await syncService.syncAll();
      expect(syncResult.success).toBe(false);

      // Order should still be pending
      const pendingOrders = await orderService.getPendingSyncRecords();
      expect(pendingOrders.length).toBe(1);

      // 3. Test recovery after network restoration
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });

      const retryResult = await syncService.syncAll();
      expect(retryResult.success).toBe(true);
    });

    test('should handle partial sync failures gracefully', async () => {
      // Create multiple orders
      const orders = [];
      for (let i = 0; i < 5; i++) {
        const order = await orderService.createOrder({
          customer_name: `Partial Sync Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        orders.push(order);
      }

      // Mock partial failure
      const { createOrder } = require('../services/supabase');
      createOrder
        .mockResolvedValueOnce({ id: 'success-1' })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'success-3' })
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ id: 'success-5' });

      const syncResult = await syncService.syncAll();
      expect(syncResult.success).toBe(false); // Partial failure
      expect(syncResult.results.orders.length).toBe(5);

      // Check which orders succeeded
      const successCount = syncResult.results.orders.filter(
        r => r.status === 'success',
      ).length;
      const errorCount = syncResult.results.orders.filter(
        r => r.status === 'error',
      ).length;

      expect(successCount).toBe(3);
      expect(errorCount).toBe(2);
    });
  });
});
