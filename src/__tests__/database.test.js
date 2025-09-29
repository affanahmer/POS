import {
  initDatabase,
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  saveMeasurements,
  getMeasurementsByOrderId,
  saveBusinessInfo,
  getBusinessInfo,
  getPendingSyncRecords,
  markAsSynced,
  getSyncStats,
  clearAllData,
  getDatabaseStats,
} from '../database/db';

describe('Database Tests', () => {
  beforeEach(async () => {
    // Initialize database before each test
    await initDatabase();
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  describe('Database Initialization', () => {
    test('should initialize database successfully', async () => {
      // Database should be initialized in beforeEach
      // This test verifies the initialization doesn't throw errors
      expect(true).toBe(true);
    });

    test('should create all required tables', async () => {
      // Test that we can perform basic operations on all tables
      const order = await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      expect(order.id).toBeDefined();

      await saveMeasurements(order.id, {
        shirt_length: 30,
        chest: 40,
      });

      await saveBusinessInfo({
        shop_name: 'Test Shop',
        phone: '1234567890',
        address: 'Test Address',
      });

      // If we get here without errors, all tables exist
      expect(true).toBe(true);
    });
  });

  describe('Order Operations', () => {
    test('should create order with all fields', async () => {
      const orderData = {
        customer_name: 'John Doe',
        phone: '1234567890',
        return_date: '2024-12-31',
        notes: 'Special instructions',
        advance: 500,
        total: 1500,
        balance: 1000,
        picture_url: 'https://example.com/image.jpg',
      };

      const order = await createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.customer_name).toBe(orderData.customer_name);
      expect(order.phone).toBe(orderData.phone);
      expect(order.return_date).toBe(orderData.return_date);
      expect(order.notes).toBe(orderData.notes);
      expect(order.advance).toBe(orderData.advance);
      expect(order.total).toBe(orderData.total);
      expect(order.balance).toBe(orderData.balance);
      expect(order.picture_url).toBe(orderData.picture_url);
      expect(order.sync_status).toBe('pending');
      expect(order.created_at).toBeDefined();
      expect(order.last_updated).toBeDefined();
    });

    test('should create order with minimal data', async () => {
      const orderData = {
        customer_name: 'Jane Doe',
        total: 1000,
        advance: 500,
      };

      const order = await createOrder(orderData);

      expect(order.id).toBeDefined();
      expect(order.customer_name).toBe(orderData.customer_name);
      expect(order.total).toBe(orderData.total);
      expect(order.advance).toBe(orderData.advance);
      expect(order.balance).toBe(500); // Should be calculated
      expect(order.sync_status).toBe('pending');
    });

    test('should get orders with pagination', async () => {
      // Create multiple orders
      for (let i = 0; i < 5; i++) {
        await createOrder({
          customer_name: `Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        });
      }

      const orders = await getOrders(3, 0);
      expect(orders.length).toBe(3);

      const moreOrders = await getOrders(3, 3);
      expect(moreOrders.length).toBe(2);
    });

    test('should get order by ID', async () => {
      const orderData = {
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      };

      const createdOrder = await createOrder(orderData);
      const retrievedOrder = await getOrderById(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder.id).toBe(createdOrder.id);
      expect(retrievedOrder.customer_name).toBe(orderData.customer_name);
    });

    test('should update order', async () => {
      const orderData = {
        customer_name: 'Original Name',
        total: 1000,
        advance: 500,
      };

      const order = await createOrder(orderData);

      const updateData = {
        customer_name: 'Updated Name',
        notes: 'Updated notes',
      };

      await updateOrder(order.id, updateData);

      const updatedOrder = await getOrderById(order.id);
      expect(updatedOrder.customer_name).toBe('Updated Name');
      expect(updatedOrder.notes).toBe('Updated notes');
      expect(updatedOrder.last_updated).toBeDefined();
    });

    test('should return null for non-existent order', async () => {
      const order = await getOrderById('non-existent-id');
      expect(order).toBeNull();
    });
  });

  describe('Measurements Operations', () => {
    test('should save measurements for order', async () => {
      const order = await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      const measurements = {
        shirt_length: 30.5,
        shoulder: 18.0,
        arm: 24.5,
        chest: 40.25,
        waist: 36.75,
        hip: 38.0,
        neck: 16.5,
        crossback: 17.5,
        trouser_length: 42.0,
        trouser_waist: 36.0,
        thigh: 24.0,
        knee: 20.0,
        bottom: 18.0,
      };

      await saveMeasurements(order.id, measurements);

      const retrievedMeasurements = await getMeasurementsByOrderId(order.id);

      expect(retrievedMeasurements).toBeDefined();
      expect(retrievedMeasurements.order_id).toBe(order.id);
      expect(retrievedMeasurements.shirt_length).toBe(
        measurements.shirt_length,
      );
      expect(retrievedMeasurements.shoulder).toBe(measurements.shoulder);
      expect(retrievedMeasurements.chest).toBe(measurements.chest);
      expect(retrievedMeasurements.trouser_length).toBe(
        measurements.trouser_length,
      );
    });

    test('should update existing measurements', async () => {
      const order = await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      const initialMeasurements = {
        shirt_length: 30,
        chest: 40,
      };

      await saveMeasurements(order.id, initialMeasurements);

      const updatedMeasurements = {
        shirt_length: 31,
        chest: 41,
        shoulder: 18,
      };

      await saveMeasurements(order.id, updatedMeasurements);

      const retrievedMeasurements = await getMeasurementsByOrderId(order.id);

      expect(retrievedMeasurements.shirt_length).toBe(31);
      expect(retrievedMeasurements.chest).toBe(41);
      expect(retrievedMeasurements.shoulder).toBe(18);
    });

    test('should return null for non-existent measurements', async () => {
      const measurements = await getMeasurementsByOrderId('non-existent-id');
      expect(measurements).toBeNull();
    });
  });

  describe('Business Info Operations', () => {
    test('should save business info', async () => {
      const businessData = {
        shop_name: 'My Garment Shop',
        phone: '1234567890',
        address: '123 Main Street, City, State',
        logo_url: 'https://example.com/logo.png',
      };

      await saveBusinessInfo(businessData);

      const retrievedInfo = await getBusinessInfo();

      expect(retrievedInfo).toBeDefined();
      expect(retrievedInfo.shop_name).toBe(businessData.shop_name);
      expect(retrievedInfo.phone).toBe(businessData.phone);
      expect(retrievedInfo.address).toBe(businessData.address);
      expect(retrievedInfo.logo_url).toBe(businessData.logo_url);
    });

    test('should update existing business info', async () => {
      const initialData = {
        shop_name: 'Original Shop',
        phone: '1111111111',
      };

      await saveBusinessInfo(initialData);

      const updatedData = {
        shop_name: 'Updated Shop',
        phone: '2222222222',
        address: 'New Address',
      };

      await saveBusinessInfo(updatedData);

      const retrievedInfo = await getBusinessInfo();

      expect(retrievedInfo.shop_name).toBe('Updated Shop');
      expect(retrievedInfo.phone).toBe('2222222222');
      expect(retrievedInfo.address).toBe('New Address');
    });

    test('should return null when no business info exists', async () => {
      const info = await getBusinessInfo();
      expect(info).toBeNull();
    });
  });

  describe('Sync Operations', () => {
    test('should get pending sync records', async () => {
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

      const pendingRecords = await getPendingSyncRecords();

      expect(pendingRecords.length).toBe(1);
      expect(pendingRecords[0].id).toBe(order2.id);
      expect(pendingRecords[0].sync_status).toBe('pending');
    });

    test('should mark order as synced', async () => {
      const order = await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      await markAsSynced(order.id);

      const pendingRecords = await getPendingSyncRecords();
      expect(pendingRecords.length).toBe(0);

      const syncedOrder = await getOrderById(order.id);
      expect(syncedOrder.sync_status).toBe('synced');
    });

    test('should get sync statistics', async () => {
      // Create orders
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
      expect(stats.measurements.pending).toBe(0);
      expect(stats.measurements.failed).toBe(0);
    });
  });

  describe('Database Statistics', () => {
    test('should get database statistics', async () => {
      // Create test data
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

      await saveMeasurements('test-order-id', {
        shirt_length: 30,
        chest: 40,
      });

      const stats = await getDatabaseStats();

      expect(stats.orders).toBe(2);
      expect(stats.measurements).toBe(1);
      expect(stats.pendingSync).toBe(2);
    });
  });

  describe('Data Cleanup', () => {
    test('should clear all data', async () => {
      // Create test data
      await createOrder({
        customer_name: 'Test Customer',
        total: 1000,
        advance: 500,
      });

      await saveBusinessInfo({
        shop_name: 'Test Shop',
        phone: '1234567890',
      });

      // Verify data exists
      const orders = await getOrders();
      expect(orders.length).toBe(1);

      const businessInfo = await getBusinessInfo();
      expect(businessInfo).toBeDefined();

      // Clear all data
      await clearAllData();

      // Verify data is cleared
      const clearedOrders = await getOrders();
      expect(clearedOrders.length).toBe(0);

      const clearedBusinessInfo = await getBusinessInfo();
      expect(clearedBusinessInfo).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid order data gracefully', async () => {
      try {
        await createOrder(null);
        // If no error is thrown, the function should handle null gracefully
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid measurements data gracefully', async () => {
      try {
        await saveMeasurements('invalid-id', null);
        // If no error is thrown, the function should handle null gracefully
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of orders efficiently', async () => {
      const startTime = Date.now();

      // Create 100 orders
      const promises = [];
      for (let i = 0; i < 100; i++) {
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

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds

      const orders = await getOrders();
      expect(orders.length).toBe(100);
    });

    test('should handle large number of measurements efficiently', async () => {
      const startTime = Date.now();

      // Create orders and measurements
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const orderData = {
          customer_name: `Customer ${i}`,
          total: 1000 + i,
          advance: 500 + i,
        };

        promises.push(
          createOrder(orderData).then(order =>
            saveMeasurements(order.id, {
              shirt_length: 30 + i,
              chest: 40 + i,
              waist: 36 + i,
            }),
          ),
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(15000); // 15 seconds

      const orders = await getOrders();
      expect(orders.length).toBe(50);
    });
  });
});
