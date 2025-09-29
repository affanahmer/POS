import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

// Helper functions for GarmentPOS app

// Validation helpers
export const validateEmail = email => {
  const rule = VALIDATION_RULES.email;
  if (!email || !rule.pattern.test(email)) {
    return { isValid: false, message: rule.message };
  }
  return { isValid: true };
};

export const validatePhone = phone => {
  const rule = VALIDATION_RULES.phone;
  if (!phone) return { isValid: true }; // Phone is optional
  if (!rule.pattern.test(phone)) {
    return { isValid: false, message: rule.message };
  }
  return { isValid: true };
};

export const validateName = name => {
  const rule = VALIDATION_RULES.name;
  if (!name || name.length < rule.minLength || name.length > rule.maxLength) {
    return { isValid: false, message: rule.message };
  }
  return { isValid: true };
};

export const validateAmount = amount => {
  const rule = VALIDATION_RULES.amount;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < rule.min) {
    return { isValid: false, message: rule.message };
  }
  return { isValid: true };
};

// Format helpers
export const formatCurrency = (amount, currency = 'PKR') => {
  return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
};

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return d.toLocaleTimeString();
    case 'datetime':
      return d.toLocaleString();
    default:
      return d.toLocaleDateString();
  }
};

export const formatPhoneNumber = phone => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as XXX-XXX-XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Calculation helpers
export const calculateBalance = (total, advance) => {
  const totalAmount = parseFloat(total || 0);
  const advanceAmount = parseFloat(advance || 0);
  return Math.max(0, totalAmount - advanceAmount);
};

export const calculateTotal = items => {
  return items.reduce((sum, item) => {
    const price = parseFloat(item.price || 0);
    const quantity = parseFloat(item.quantity || 1);
    return sum + price * quantity;
  }, 0);
};

// String helpers
export const capitalizeFirst = str => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `ORD-${timestamp}-${random}`;
};

// Array helpers
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Object helpers
export const isEmpty = obj => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

export const pick = (obj, keys) => {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Error handling helpers
export const getErrorMessage = (
  error,
  defaultMessage = ERROR_MESSAGES.UNKNOWN_ERROR,
) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return defaultMessage;
};

export const isNetworkError = error => {
  return (
    error?.message?.includes('network') ||
    error?.message?.includes('connection') ||
    error?.code === 'NETWORK_ERROR'
  );
};

// File helpers
export const getFileExtension = filename => {
  return filename.split('.').pop().toLowerCase();
};

export const isValidImageFile = filename => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const extension = getFileExtension(filename);
  return validExtensions.includes(extension);
};

export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Date helpers
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isToday = date => {
  const today = new Date();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

export const isThisWeek = date => {
  const today = new Date();
  const checkDate = new Date(date);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return checkDate >= weekAgo && checkDate <= today;
};

export const isThisMonth = date => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
};
