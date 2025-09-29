import { initDatabase, clearAllData } from '../database/db';
import { orderService } from '../services/orderService';
import { syncService } from '../services/syncService';
import { printService } from '../services/printService';

// Mock external dependencies
jest.mock('../services/supabase', () => ({
  createOrder: jest.fn(),
  upsertMeasurements: jest.fn(),
  uploadImageWithProgress: jest.fn(),
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

describe('Performance Tests', () => {
  beforeEach(async () => {
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    await clearAllData();
  });

  describe('Database Performance', () => {
    test('should handle large order creation efficiently', async () => {
      const startTime = Date.now();
      const orderCount = 1000;

      // Create orders in batches for better performance
      const batchSize = 50;
      const batches = Math.ceil(orderCount / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = [];
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, orderCount);

        for (let i = startIndex; i < endIndex; i++) {
          batchPromises.push(
            orderService.createOrder({
              customer_name: `Performance Customer ${i}`,
              phone: `123456789${i.toString().padStart(3, '0')}`,
              total: 1000 + i,
              advance: 500 + i,
            }),
          );
        }

        await Promise.all(batchPromises);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for 1000 orders
      expect(duration).toBeLessThan(10000);

      // Verify all orders were created
      const orders = await orderService.getOrders();
      expect(orders.length).toBe(orderCount);

      console.log(`Created ${orderCount} orders in ${duration}ms`);
      console.log(`Average time per order: ${duration / orderCount}ms`);
    });

    test('should handle large measurements dataset efficiently', async () => {
      const startTime = Date.now();
      const measurementCount = 500;

      // Create orders first
      const orders = [];
      for (let i = 0; i < measurementCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Measurement Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        orders.push(order);
      }

      // Add measurements in batches
      const batchSize = 25;
      const batches = Math.ceil(measurementCount / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = [];
        const startIndex = batch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, measurementCount);

        for (let i = startIndex; i < endIndex; i++) {
          batchPromises.push(
            orderService.saveMeasurements(orders[i].id, {
              shirt_length: 30 + i * 0.1,
              shoulder: 19 + i * 0.05,
              arm: 25 + i * 0.1,
              chest: 40 + i * 0.1,
              waist: 36 + i * 0.1,
              hip: 38 + i * 0.1,
              neck: 17 + i * 0.05,
              crossback: 18 + i * 0.05,
              trouser_length: 42 + i * 0.1,
              trouser_waist: 36 + i * 0.1,
              thigh: 24 + i * 0.1,
              knee: 20 + i * 0.1,
              bottom: 18 + i * 0.1,
            }),
          );
        }

        await Promise.all(batchPromises);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 15 seconds for 500 measurements
      expect(duration).toBeLessThan(15000);

      // Verify measurements were saved
      const measurements = await orderService.getMeasurementsByOrderId(
        orders[0].id,
      );
      expect(measurements).toBeDefined();

      console.log(`Created ${measurementCount} measurements in ${duration}ms`);
      console.log(
        `Average time per measurement: ${duration / measurementCount}ms`,
      );
    });

    test('should handle complex queries efficiently', async () => {
      // Create test data
      const orderCount = 1000;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Query Customer ${i}`,
          phone: `123456789${i.toString().padStart(3, '0')}`,
          total: 1000 + (i % 10) * 100,
          advance: 500 + (i % 10) * 50,
        });
        orders.push(order);
      }

      // Test various query patterns
      const queryTests = [
        {
          name: 'Get all orders',
          test: () => orderService.getOrders(),
        },
        {
          name: 'Get orders with limit',
          test: () => orderService.getOrders(100),
        },
        {
          name: 'Get pending sync records',
          test: () => orderService.getPendingSyncRecords(50),
        },
        {
          name: 'Get database stats',
          test: () => orderService.getDatabaseStats(),
        },
      ];

      for (const queryTest of queryTests) {
        const startTime = Date.now();
        const result = await queryTest.test();
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Each query should complete within 1 second
        expect(duration).toBeLessThan(1000);

        console.log(`${queryTest.name}: ${duration}ms`);
      }
    });
  });

  describe('Sync Performance', () => {
    test('should handle large sync operations efficiently', async () => {
      // Create test data
      const orderCount = 200;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Sync Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        await orderService.saveMeasurements(order.id, {
          shirt_length: 30 + i * 0.1,
          chest: 40 + i * 0.1,
          waist: 36 + i * 0.1,
        });
        orders.push(order);
      }

      // Mock successful sync responses
      const {
        createOrder,
        upsertMeasurements,
      } = require('../services/supabase');
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });
      upsertMeasurements.mockResolvedValue({ id: 'supabase-measurement-id' });

      // Test sync performance
      const startTime = Date.now();
      const syncResult = await syncService.syncAllWithProgress(progress => {
        // Progress callback should be called frequently
        expect(progress.current).toBeGreaterThanOrEqual(0);
        expect(progress.total).toBeGreaterThan(0);
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Sync should complete within 30 seconds for 200 orders
      expect(duration).toBeLessThan(30000);
      expect(syncResult.success).toBe(true);

      console.log(`Synced ${orderCount} orders in ${duration}ms`);
      console.log(`Average time per order sync: ${duration / orderCount}ms`);
    });

    test('should handle concurrent sync operations', async () => {
      // Create test data
      const orderCount = 100;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Concurrent Sync Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        orders.push(order);
      }

      // Mock successful sync responses
      const { createOrder } = require('../services/supabase');
      createOrder.mockResolvedValue({ id: 'supabase-order-id' });

      // Test concurrent sync operations
      const startTime = Date.now();
      const syncPromises = [];

      // Start multiple sync operations concurrently
      for (let i = 0; i < 5; i++) {
        syncPromises.push(syncService.syncAll());
      }

      const results = await Promise.all(syncPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All sync operations should complete
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within 20 seconds
      expect(duration).toBeLessThan(20000);

      console.log(`Completed 5 concurrent sync operations in ${duration}ms`);
    });
  });

  describe('Print Performance', () => {
    test('should generate print templates efficiently', async () => {
      // Create test data
      const orderCount = 100;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Print Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        await orderService.saveMeasurements(order.id, {
          shirt_length: 30 + i * 0.1,
          chest: 40 + i * 0.1,
          waist: 36 + i * 0.1,
        });
        orders.push(order);
      }

      const businessInfo = {
        shop_name: 'Performance Test Shop',
        phone: '555-0123',
        address: '123 Performance Street',
      };

      // Test receipt generation performance
      const startTime = Date.now();
      const receiptPromises = [];

      for (let i = 0; i < orderCount; i++) {
        receiptPromises.push(
          printService.generateReceiptTemplate(
            orders[i],
            await orderService.getMeasurementsByOrderId(orders[i].id),
            businessInfo,
          ),
        );
      }

      const receipts = await Promise.all(receiptPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds for 100 receipts
      expect(duration).toBeLessThan(5000);

      // Verify receipts were generated
      receipts.forEach(receipt => {
        expect(receipt).toContain('Print Customer');
        expect(receipt).toContain('Performance Test Shop');
      });

      console.log(`Generated ${orderCount} receipts in ${duration}ms`);
      console.log(`Average time per receipt: ${duration / orderCount}ms`);
    });

    test('should handle large job sheet generation efficiently', async () => {
      // Create test data with comprehensive measurements
      const orderCount = 50;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Job Sheet Customer ${i}`,
          total: 2000 + i,
          advance: 1000 + i,
        });
        await orderService.saveMeasurements(order.id, {
          // Shirt measurements
          shirt_length: 32 + i * 0.1,
          shoulder: 19 + i * 0.05,
          arm: 25 + i * 0.1,
          chest: 42 + i * 0.1,
          waist: 38 + i * 0.1,
          hip: 40 + i * 0.1,
          neck: 17 + i * 0.05,
          crossback: 18 + i * 0.05,
          // Trouser measurements
          trouser_length: 43 + i * 0.1,
          trouser_waist: 38 + i * 0.1,
          thigh: 24 + i * 0.1,
          knee: 20 + i * 0.1,
          bottom: 18 + i * 0.1,
        });
        orders.push(order);
      }

      const businessInfo = {
        shop_name: 'Job Sheet Performance Shop',
        phone: '555-0456',
        address: '456 Job Sheet Avenue',
      };

      // Test job sheet generation performance
      const startTime = Date.now();
      const jobSheetPromises = [];

      for (let i = 0; i < orderCount; i++) {
        jobSheetPromises.push(
          printService.generateJobSheetTemplate(
            orders[i],
            await orderService.getMeasurementsByOrderId(orders[i].id),
            businessInfo,
          ),
        );
      }

      const jobSheets = await Promise.all(jobSheetPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds for 50 job sheets
      expect(duration).toBeLessThan(10000);

      // Verify job sheets were generated
      jobSheets.forEach(jobSheet => {
        expect(jobSheet).toContain('Job Sheet Customer');
        expect(jobSheet).toContain('Job Sheet Performance Shop');
        expect(jobSheet).toContain('32'); // shirt_length
        expect(jobSheet).toContain('43'); // trouser_length
      });

      console.log(`Generated ${orderCount} job sheets in ${duration}ms`);
      console.log(`Average time per job sheet: ${duration / orderCount}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    test('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', initialMemory);

      // Create large dataset
      const orderCount = 500;
      const orders = [];

      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Memory Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        await orderService.saveMeasurements(order.id, {
          shirt_length: 30 + i * 0.1,
          chest: 40 + i * 0.1,
          waist: 36 + i * 0.1,
        });
        orders.push(order);
      }

      const afterCreationMemory = process.memoryUsage();
      console.log('Memory after creation:', afterCreationMemory);

      // Test memory usage during operations
      const operations = [
        () => orderService.getOrders(),
        () => orderService.getPendingSyncRecords(),
        () => orderService.getDatabaseStats(),
      ];

      for (const operation of operations) {
        const startMemory = process.memoryUsage();
        await operation();
        const endMemory = process.memoryUsage();

        // Memory usage should not increase significantly
        const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
      }

      // Clean up
      await clearAllData();
      const afterCleanupMemory = process.memoryUsage();
      console.log('Memory after cleanup:', afterCleanupMemory);

      // Memory should be close to initial after cleanup
      const memoryDifference =
        afterCleanupMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryDifference).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe('Stress Tests', () => {
    test('should handle rapid order creation', async () => {
      const startTime = Date.now();
      const orderCount = 100;
      const orders = [];

      // Create orders as fast as possible
      for (let i = 0; i < orderCount; i++) {
        const order = await orderService.createOrder({
          customer_name: `Rapid Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
        orders.push(order);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);

      // Verify all orders were created
      const allOrders = await orderService.getOrders();
      expect(allOrders.length).toBe(orderCount);

      console.log(`Created ${orderCount} orders rapidly in ${duration}ms`);
    });

    test('should handle mixed operations concurrently', async () => {
      const startTime = Date.now();
      const operationCount = 50;

      // Mix of different operations
      const operations = [];

      for (let i = 0; i < operationCount; i++) {
        // Create order
        operations.push(
          orderService.createOrder({
            customer_name: `Mixed Customer ${i}`,
            total: 1000 + i,
            advance: 500 + i,
          }),
        );

        // Get orders
        operations.push(orderService.getOrders(10));

        // Get database stats
        operations.push(orderService.getDatabaseStats());
      }

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);

      // Verify operations completed successfully
      expect(results.length).toBe(operationCount * 3);

      console.log(
        `Completed ${operationCount * 3} mixed operations in ${duration}ms`,
      );
    });
  });
});
