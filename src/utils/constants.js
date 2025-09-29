// Constants for GarmentPOS app

export const APP_CONFIG = {
  name: 'GarmentPOS',
  version: '1.0.0',
  description: 'Garment Store Management System',
};

export const DATABASE_CONFIG = {
  name: 'GarmentPOS.db',
  version: 1,
  location: 'default',
};

export const SYNC_CONFIG = {
  interval: 15 * 60 * 1000, // 15 minutes in milliseconds
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
};

export const STORAGE_CONFIG = {
  bucket: 'attachments',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
};

export const PRINT_CONFIG = {
  paperWidth: 58, // mm
  paperHeight: 80, // mm
  fontSize: 12,
  lineHeight: 1.2,
};

export const MEASUREMENT_FIELDS = {
  shirt: [
    'shirt_length',
    'shoulder',
    'arm',
    'chest',
    'waist',
    'hip',
    'neck',
    'crossback',
  ],
  trouser: ['trouser_length', 'trouser_waist', 'thigh', 'knee', 'bottom'],
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  ERROR: 'error',
};

export const SYNC_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SYNC: 'sync',
};

export const SYNC_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
};

export const VALIDATION_RULES = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    required: false,
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters',
  },
  amount: {
    required: true,
    min: 0,
    message: 'Amount must be a positive number',
  },
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    'Network connection error. Please check your internet connection.',
  DATABASE_ERROR: 'Database error. Please try again.',
  SYNC_ERROR: 'Sync error. Data will be synced when connection is restored.',
  AUTH_ERROR: 'Authentication error. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_DELETED: 'Order deleted successfully',
  SYNC_COMPLETED: 'Sync completed successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  PRINTER_CONNECTED: 'Printer connected successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
};
