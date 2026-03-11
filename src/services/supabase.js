// Supabase configuration
const SUPABASE_URL = 'https://banfpanueccbuaavtlmc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbmZwYW51ZWNjYnVhdnRsbXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTQ1NDIsImV4cCI6MjA3NDA5MDU0Mn0.L-ntIxjbd0Tjt-H4wQBuWngNVBzfaV1ZmF9Rru_SO5I';

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    enabled: false,
  },
});

// Storage bucket name for attachments
export const STORAGE_BUCKET = 'attachments';

// Helper function to get public URL for uploaded files
export const getPublicUrl = path => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// Helper function to upload file to storage
export const uploadFile = async (file, path) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return getPublicUrl(path);
};

// Create order in Supabase
export const createOrder = async orderData => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Get all orders from Supabase
export const getOrders = async (limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data;
};

// Create or update measurements in Supabase
export const upsertMeasurements = async measurementsData => {
  const { data, error } = await supabase
    .from('measurements')
    .upsert(measurementsData, {
      onConflict: 'order_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Create or update business info in Supabase
export const upsertBusinessInfo = async businessData => {
  const { data, error } = await supabase
    .from('business_info')
    .upsert(businessData, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Get business info from Supabase
export const getBusinessInfo = async () => {
  const { data, error } = await supabase
    .from('business_info')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

// Update order in Supabase
export const updateOrder = async (orderId, updateData) => {
  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Get order by ID from Supabase
export const getOrderById = async orderId => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Delete order from Supabase
export const deleteOrder = async orderId => {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);

  if (error) {
    throw error;
  }

  return { success: true };
};

// Get measurements by order ID from Supabase
export const getMeasurementsByOrderId = async orderId => {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

// Delete file from storage
export const deleteFile = async (path) => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }

  return { success: true };
};

// Upload image with progress tracking
export const uploadImageWithProgress = async (imageUri, orderId) => {
  try {
    // Create a FormData object for the image
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `order_${orderId}_${Date.now()}.jpg`,
    });

    const path = `orders/${orderId}/${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, formData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const publicUrl = getPublicUrl(path);

    return {
      success: true,
      publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
