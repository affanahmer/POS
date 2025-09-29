import { VALIDATION_RULES } from './constants';

// Validation functions for GarmentPOS app

// Generic validation function
export const validate = (value, rules) => {
  const errors = [];

  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${rules.field || 'Field'} is required`);
    return { isValid: false, errors };
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    errors.push(
      `${rules.field || 'Field'} must be at least ${
        rules.minLength
      } characters`,
    );
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    errors.push(
      `${rules.field || 'Field'} must be no more than ${
        rules.maxLength
      } characters`,
    );
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message || `${rules.field || 'Field'} format is invalid`);
  }

  if (value && rules.min !== undefined && parseFloat(value) < rules.min) {
    errors.push(`${rules.field || 'Field'} must be at least ${rules.min}`);
  }

  if (value && rules.max !== undefined && parseFloat(value) > rules.max) {
    errors.push(`${rules.field || 'Field'} must be no more than ${rules.max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Order validation
export const validateOrder = orderData => {
  const errors = [];

  // Validate customer name
  const nameValidation = validate(orderData.customer_name, {
    ...VALIDATION_RULES.name,
    field: 'Customer Name',
  });
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validate phone (optional)
  if (orderData.phone) {
    const phoneValidation = validate(orderData.phone, {
      ...VALIDATION_RULES.phone,
      field: 'Phone',
    });
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    }
  }

  // Validate advance amount
  const advanceValidation = validate(orderData.advance, {
    ...VALIDATION_RULES.amount,
    field: 'Advance Amount',
  });
  if (!advanceValidation.isValid) {
    errors.push(...advanceValidation.errors);
  }

  // Validate total amount
  const totalValidation = validate(orderData.total, {
    ...VALIDATION_RULES.amount,
    field: 'Total Amount',
  });
  if (!totalValidation.isValid) {
    errors.push(...totalValidation.errors);
  }

  // Validate advance is not greater than total
  if (
    orderData.advance &&
    orderData.total &&
    parseFloat(orderData.advance) > parseFloat(orderData.total)
  ) {
    errors.push('Advance amount cannot be greater than total amount');
  }

  // Validate return date is in the future
  if (orderData.return_date) {
    const returnDate = new Date(orderData.return_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (returnDate < today) {
      errors.push('Return date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Measurement validation
export const validateMeasurements = (measurements, type = 'shirt') => {
  const errors = [];
  const fields =
    type === 'shirt' ? VALIDATION_RULES.shirt : VALIDATION_RULES.trouser;

  // Check if at least one measurement is provided
  const hasMeasurements = fields.some(
    field => measurements[field] && parseFloat(measurements[field]) > 0,
  );

  if (!hasMeasurements) {
    errors.push(`At least one ${type} measurement is required`);
  }

  // Validate each measurement field
  fields.forEach(field => {
    if (measurements[field]) {
      const value = parseFloat(measurements[field]);
      if (isNaN(value) || value < 0) {
        errors.push(`${field.replace('_', ' ')} must be a positive number`);
      }
      if (value > 100) {
        // Assuming measurements are in inches
        errors.push(
          `${field.replace('_', ' ')} seems too large (max 100 inches)`,
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Business info validation
export const validateBusinessInfo = businessData => {
  const errors = [];

  // Validate shop name
  if (businessData.shop_name) {
    const nameValidation = validate(businessData.shop_name, {
      ...VALIDATION_RULES.name,
      field: 'Shop Name',
    });
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    }
  }

  // Validate phone
  if (businessData.phone) {
    const phoneValidation = validate(businessData.phone, {
      ...VALIDATION_RULES.phone,
      field: 'Phone',
    });
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    }
  }

  // Validate address length
  if (businessData.address && businessData.address.length > 500) {
    errors.push('Address must be no more than 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Email validation
export const validateEmail = email => {
  return validate(email, {
    ...VALIDATION_RULES.email,
    field: 'Email',
  });
};

// Phone validation
export const validatePhone = phone => {
  return validate(phone, {
    ...VALIDATION_RULES.phone,
    field: 'Phone',
  });
};

// Amount validation
export const validateAmount = (amount, fieldName = 'Amount') => {
  return validate(amount, {
    ...VALIDATION_RULES.amount,
    field: fieldName,
  });
};

// File validation
export const validateFile = (file, options = {}) => {
  const errors = [];
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    fieldName = 'File',
  } = options;

  if (!file) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(
      `${fieldName} size must be less than ${Math.round(
        maxSize / 1024 / 1024,
      )}MB`,
    );
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`${fieldName} type must be one of: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    const validation = validate(value, { ...rules, field });

    if (!validation.isValid) {
      errors[field] = validation.errors;
      isValid = false;
    }
  });

  return {
    isValid,
    errors,
  };
};

// Sanitize input
export const sanitizeInput = input => {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, ''); // Remove quotes
};

// Sanitize object inputs
export const sanitizeObject = obj => {
  const sanitized = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};
