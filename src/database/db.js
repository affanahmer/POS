import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

let db = null;

// Database initialization with migrations
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabase({
      name: 'GarmentPOS.db',
      location: 'default',
    });

    await runMigrations();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Database migrations system
const runMigrations = async () => {
  try {
    // Check if migrations table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get current database version
    const currentVersion = await getCurrentVersion();
    console.log('Current database version:', currentVersion);

    // Run migrations
    await runMigration('001_initial_schema', createInitialSchema);
    await runMigration('002_add_sync_fields', addSyncFields);
    await runMigration('003_add_indexes', addIndexes);
    await runMigration('004_add_constraints', addConstraints);
    await runMigration(
      '005_update_measurement_fields',
      updateMeasurementFields,
    );
    await runMigration('006_add_order_status', addOrderStatusFields);

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Get current database version
const getCurrentVersion = async () => {
  try {
    const results = await executeQuery(
      'SELECT version FROM migrations ORDER BY id DESC LIMIT 1',
    );
    return results.rows.length > 0 ? results.rows.item(0).version : '0';
  } catch (error) {
    return '0';
  }
};

// Run a specific migration
const runMigration = async (version, migrationFunction) => {
  try {
    const currentVersion = await getCurrentVersion();

    // Check if migration already applied
    const results = await executeQuery(
      'SELECT version FROM migrations WHERE version = ?',
      [version],
    );

    if (results.rows.length > 0) {
      console.log(`Migration ${version} already applied, skipping`);
      return;
    }

    console.log(`Running migration ${version}...`);
    await migrationFunction();

    // Mark migration as applied
    await executeQuery('INSERT INTO migrations (version) VALUES (?)', [
      version,
    ]);

    console.log(`Migration ${version} completed successfully`);
  } catch (error) {
    console.error(`Migration ${version} failed:`, error);
    throw error;
  }
};

// Migration 001: Initial schema
const createInitialSchema = async () => {
  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders_local (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT,
      return_date TEXT,
      notes TEXT,
      advance REAL DEFAULT 0,
      total REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      picture_url TEXT,
      sync_status TEXT DEFAULT 'pending',
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createMeasurementsTable = `
    CREATE TABLE IF NOT EXISTS measurements_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      -- Shirt measurements
      shirt_length REAL,
      shoulder REAL,
      arm REAL,
      chest REAL,
      waist REAL,
      hip REAL,
      neck REAL,
      crossback REAL,
      -- Trouser measurements
      trouser_length REAL,
      trouser_waist REAL,
      thigh REAL,
      knee REAL,
      bottom REAL,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders_local (id) ON DELETE CASCADE
    );
  `;

  const createBusinessInfoTable = `
    CREATE TABLE IF NOT EXISTS business_info_local (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT,
      phone TEXT,
      address TEXT,
      logo_url TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSyncLogTable = `
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await executeQuery(createOrdersTable);
  await executeQuery(createMeasurementsTable);
  await executeQuery(createBusinessInfoTable);
  await executeQuery(createSyncLogTable);
};

// Migration 002: Add sync fields
const addSyncFields = async () => {
  // Add sync-specific fields to orders table
  await executeQuery(`
    ALTER TABLE orders_local ADD COLUMN sync_attempts INTEGER DEFAULT 0;
  `);

  await executeQuery(`
    ALTER TABLE orders_local ADD COLUMN sync_error TEXT;
  `);

  await executeQuery(`
    ALTER TABLE orders_local ADD COLUMN last_sync_attempt TEXT;
  `);

  // Add sync fields to measurements table
  await executeQuery(`
    ALTER TABLE measurements_local ADD COLUMN sync_status TEXT DEFAULT 'pending';
  `);

  await executeQuery(`
    ALTER TABLE measurements_local ADD COLUMN sync_attempts INTEGER DEFAULT 0;
  `);

  await executeQuery(`
    ALTER TABLE measurements_local ADD COLUMN sync_error TEXT;
  `);
};

// Migration 003: Add indexes for performance
const addIndexes = async () => {
  // Indexes for sync operations
  await executeQuery(`
    CREATE INDEX IF NOT EXISTS idx_orders_sync_status 
    ON orders_local(sync_status);
  `);

  await executeQuery(`
    CREATE INDEX IF NOT EXISTS idx_orders_last_updated 
    ON orders_local(last_updated);
  `);

  await executeQuery(`
    CREATE INDEX IF NOT EXISTS idx_measurements_order_id 
    ON measurements_local(order_id);
  `);

  await executeQuery(`
    CREATE INDEX IF NOT EXISTS idx_measurements_sync_status 
    ON measurements_local(sync_status);
  `);

  await executeQuery(`
    CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp 
    ON sync_log(timestamp);
  `);
};

// Migration 004: Add constraints and triggers
const addConstraints = async () => {
  // Add check constraints
  await executeQuery(`
    CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
    AFTER UPDATE ON orders_local
    BEGIN
      UPDATE orders_local SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  await executeQuery(`
    CREATE TRIGGER IF NOT EXISTS update_measurements_timestamp 
    AFTER UPDATE ON measurements_local
    BEGIN
      UPDATE measurements_local SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
};

// Migration 005: Update measurement field names
const updateMeasurementFields = async () => {
  try {
    // Check if the new fields already exist
    const tableInfo = await executeQuery(
      'PRAGMA table_info(measurements_local)',
    );
    const hasNewLength = tableInfo.rows.some(row => row.name === 'length');

    if (!hasNewLength) {
      // Add new fields
      await executeQuery(`
        ALTER TABLE measurements_local ADD COLUMN length REAL;
      `);

      // Copy data from old fields to new fields
      await executeQuery(`
        UPDATE measurements_local 
        SET length = COALESCE(shirt_length, trouser_length)
        WHERE shirt_length IS NOT NULL OR trouser_length IS NOT NULL;
      `);

      await executeQuery(`
        UPDATE measurements_local 
        SET waist = COALESCE(waist, trouser_waist)
        WHERE waist IS NOT NULL OR trouser_waist IS NOT NULL;
      `);

      console.log('Measurement fields updated successfully');
    }
  } catch (error) {
    console.log(
      'Migration 005: Field update skipped (fields may already exist)',
    );
  }
};

// Migration 006: Add order status fields
const addOrderStatusFields = async () => {
  try {
    // Add status and completed_at fields to orders table
    await executeQuery(`
      ALTER TABLE orders_local ADD COLUMN status TEXT DEFAULT 'pending';
    `);

    await executeQuery(`
      ALTER TABLE orders_local ADD COLUMN completed_at TEXT;
    `);

    console.log('Order status fields added successfully');
  } catch (error) {
    console.log('Migration 006: Status fields may already exist');
  }
};

// Get database instance
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Generic query execution
export const executeQuery = async (query, params = []) => {
  try {
    const database = getDatabase();
    const [results] = await database.executeSql(query, params);
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

// Generic insert operation
export const insertRecord = async (table, data) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');
  const values = Object.values(data);

  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  return await executeQuery(query, values);
};

// Generic update operation
export const updateRecord = async (table, data, whereClause, whereParams) => {
  const setClause = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(data), ...whereParams];

  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  return await executeQuery(query, values);
};

// Generic select operation
export const selectRecords = async (
  table,
  whereClause = '',
  whereParams = [],
) => {
  const query = `SELECT * FROM ${table} ${
    whereClause ? `WHERE ${whereClause}` : ''
  }`;
  const results = await executeQuery(query, whereParams);

  const records = [];
  for (let i = 0; i < results.rows.length; i++) {
    records.push(results.rows.item(i));
  }
  return records;
};

// Generic delete operation
export const deleteRecord = async (table, whereClause, whereParams) => {
  const query = `DELETE FROM ${table} WHERE ${whereClause}`;
  return await executeQuery(query, whereParams);
};

// Order-specific operations
export const createOrder = async orderData => {
  const orderId = `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const order = {
    id: orderId,
    ...orderData,
    sync_status: 'pending',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  await insertRecord('orders_local', order);
  return order;
};

export const getOrders = async (limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM orders_local 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const results = await executeQuery(query, [limit, offset]);

  const orders = [];
  for (let i = 0; i < results.rows.length; i++) {
    orders.push(results.rows.item(i));
  }
  return orders;
};

export const getOrderById = async orderId => {
  const orders = await selectRecords('orders_local', 'id = ?', [orderId]);
  return orders[0] || null;
};

export const updateOrder = async (orderId, updateData) => {
  const updatedData = {
    ...updateData,
    last_updated: new Date().toISOString(),
  };

  return await updateRecord('orders_local', updatedData, 'id = ?', [orderId]);
};

// Measurements-specific operations
export const saveMeasurements = async (orderId, measurements) => {
  const measurementData = {
    order_id: orderId,
    ...measurements,
    last_updated: new Date().toISOString(),
  };

  // Check if measurements already exist for this order
  const existing = await selectRecords('measurements_local', 'order_id = ?', [
    orderId,
  ]);

  if (existing.length > 0) {
    return await updateRecord(
      'measurements_local',
      measurementData,
      'order_id = ?',
      [orderId],
    );
  } else {
    return await insertRecord('measurements_local', measurementData);
  }
};

export const getMeasurementsByOrderId = async orderId => {
  const measurements = await selectRecords(
    'measurements_local',
    'order_id = ?',
    [orderId],
  );
  return measurements[0] || null;
};

// Business info operations
export const saveBusinessInfo = async businessData => {
  const existing = await selectRecords('business_info_local');

  if (existing.length > 0) {
    return await updateRecord('business_info_local', businessData, 'id = ?', [
      existing[0].id,
    ]);
  } else {
    return await insertRecord('business_info_local', businessData);
  }
};

export const getBusinessInfo = async () => {
  const info = await selectRecords('business_info_local');
  return info[0] || null;
};

// Enhanced sync operations
export const getPendingSyncRecords = async (limit = 50) => {
  const query = `
    SELECT * FROM orders_local 
    WHERE sync_status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT ?
  `;
  const results = await executeQuery(query, [limit]);

  const records = [];
  for (let i = 0; i < results.rows.length; i++) {
    records.push(results.rows.item(i));
  }
  return records;
};

export const getPendingMeasurements = async (limit = 50) => {
  const query = `
    SELECT m.*, o.customer_name 
    FROM measurements_local m
    JOIN orders_local o ON m.order_id = o.id
    WHERE m.sync_status = 'pending' 
    ORDER BY m.last_updated ASC 
    LIMIT ?
  `;
  const results = await executeQuery(query, [limit]);

  const records = [];
  for (let i = 0; i < results.rows.length; i++) {
    records.push(results.rows.item(i));
  }
  return records;
};

export const markAsSynced = async (orderId, syncData = {}) => {
  const updateData = {
    sync_status: 'synced',
    last_updated: new Date().toISOString(),
    sync_attempts: 0,
    sync_error: null,
    last_sync_attempt: new Date().toISOString(),
    ...syncData,
  };

  return await updateRecord('orders_local', updateData, 'id = ?', [orderId]);
};

export const markMeasurementsAsSynced = async (
  measurementId,
  syncData = {},
) => {
  const updateData = {
    sync_status: 'synced',
    last_updated: new Date().toISOString(),
    sync_attempts: 0,
    sync_error: null,
    ...syncData,
  };

  return await updateRecord('measurements_local', updateData, 'id = ?', [
    measurementId,
  ]);
};

export const markSyncFailed = async (orderId, errorMessage, maxRetries = 3) => {
  const query = `
    UPDATE orders_local 
    SET sync_attempts = sync_attempts + 1,
        sync_error = ?,
        last_sync_attempt = ?,
        sync_status = CASE 
          WHEN sync_attempts + 1 >= ? THEN 'failed'
          ELSE 'pending'
        END
    WHERE id = ?
  `;

  return await executeQuery(query, [
    errorMessage,
    new Date().toISOString(),
    maxRetries,
    orderId,
  ]);
};

export const markMeasurementsSyncFailed = async (
  measurementId,
  errorMessage,
  maxRetries = 3,
) => {
  const query = `
    UPDATE measurements_local 
    SET sync_attempts = sync_attempts + 1,
        sync_error = ?,
        sync_status = CASE 
          WHEN sync_attempts + 1 >= ? THEN 'failed'
          ELSE 'pending'
        END
    WHERE id = ?
  `;

  return await executeQuery(query, [
    errorMessage,
    new Date().toISOString(),
    maxRetries,
    measurementId,
  ]);
};

export const getSyncStats = async () => {
  const pendingOrders = await executeQuery(
    "SELECT COUNT(*) as count FROM orders_local WHERE sync_status = 'pending'",
  );

  const syncedOrders = await executeQuery(
    "SELECT COUNT(*) as count FROM orders_local WHERE sync_status = 'synced'",
  );

  const failedOrders = await executeQuery(
    "SELECT COUNT(*) as count FROM orders_local WHERE sync_status = 'failed'",
  );

  const pendingMeasurements = await executeQuery(
    "SELECT COUNT(*) as count FROM measurements_local WHERE sync_status = 'pending'",
  );

  const failedMeasurements = await executeQuery(
    "SELECT COUNT(*) as count FROM measurements_local WHERE sync_status = 'failed'",
  );

  return {
    orders: {
      pending: pendingOrders.rows.item(0).count,
      synced: syncedOrders.rows.item(0).count,
      failed: failedOrders.rows.item(0).count,
    },
    measurements: {
      pending: pendingMeasurements.rows.item(0).count,
      failed: failedMeasurements.rows.item(0).count,
    },
  };
};

export const resetFailedSyncs = async () => {
  // Reset failed orders to pending for retry
  await executeQuery(`
    UPDATE orders_local 
    SET sync_status = 'pending', 
        sync_attempts = 0, 
        sync_error = NULL 
    WHERE sync_status = 'failed'
  `);

  // Reset failed measurements to pending for retry
  await executeQuery(`
    UPDATE measurements_local 
    SET sync_status = 'pending', 
        sync_attempts = 0, 
        sync_error = NULL 
    WHERE sync_status = 'failed'
  `);
};

export const logSyncOperation = async (
  operation,
  tableName,
  recordId,
  status,
  errorMessage = null,
) => {
  return await insertRecord('sync_log', {
    operation,
    table_name: tableName,
    record_id: recordId,
    status,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

// Database cleanup and maintenance
export const clearAllData = async () => {
  await executeQuery('DELETE FROM measurements_local');
  await executeQuery('DELETE FROM orders_local');
  await executeQuery('DELETE FROM business_info_local');
  await executeQuery('DELETE FROM sync_log');
};

export const getDatabaseStats = async () => {
  const ordersCount = await executeQuery(
    'SELECT COUNT(*) as count FROM orders_local',
  );
  const measurementsCount = await executeQuery(
    'SELECT COUNT(*) as count FROM measurements_local',
  );
  const pendingSyncCount = await executeQuery(
    "SELECT COUNT(*) as count FROM orders_local WHERE sync_status = 'pending'",
  );

  return {
    orders: ordersCount.rows.item(0).count,
    measurements: measurementsCount.rows.item(0).count,
    pendingSync: pendingSyncCount.rows.item(0).count,
  };
};
