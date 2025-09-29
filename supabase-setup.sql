-- =====================================================
-- GarmentPOS Supabase Database Setup
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =====================================================
-- 1. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  return_date DATE,
  notes TEXT,
  advance DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  picture_url TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  sync_attempts INTEGER DEFAULT 0,
  sync_error TEXT,
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MEASUREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Shirt measurements
  shirt_length DECIMAL(5,2),
  shoulder DECIMAL(5,2),
  arm DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hip DECIMAL(5,2),
  neck DECIMAL(5,2),
  crossback DECIMAL(5,2),
  -- Trouser measurements
  trouser_length DECIMAL(5,2),
  trouser_waist DECIMAL(5,2),
  thigh DECIMAL(5,2),
  knee DECIMAL(5,2),
  bottom DECIMAL(5,2),
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  sync_attempts INTEGER DEFAULT 0,
  sync_error TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. BUSINESS INFO TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_info (
  id SERIAL PRIMARY KEY,
  shop_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SYNC LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_last_updated ON orders(last_updated);

-- Measurements table indexes
CREATE INDEX IF NOT EXISTS idx_measurements_order_id ON measurements(order_id);
CREATE INDEX IF NOT EXISTS idx_measurements_sync_status ON measurements(sync_status);
CREATE INDEX IF NOT EXISTS idx_measurements_last_updated ON measurements(last_updated);

-- Sync log indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view all orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Measurements policies
CREATE POLICY "Users can view all measurements" ON measurements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert measurements" ON measurements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update measurements" ON measurements
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete measurements" ON measurements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Business info policies
CREATE POLICY "Users can view business info" ON business_info
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert business info" ON business_info
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update business info" ON business_info
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Sync log policies
CREATE POLICY "Users can view sync logs" ON sync_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sync logs" ON sync_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for orders table
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for measurements table
CREATE TRIGGER update_measurements_updated_at 
  BEFORE UPDATE ON measurements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for business_info table
CREATE TRIGGER update_business_info_updated_at 
  BEFORE UPDATE ON business_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'attachments' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments' AND 
    auth.role() = 'authenticated'
  );

-- =====================================================
-- 9. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample business info
INSERT INTO business_info (shop_name, phone, address, logo_url)
VALUES (
  'GarmentPOS Store',
  '+91-9876543210',
  '123 Main Street, City, State - 123456',
  'https://example.com/logo.png'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. VIEWS FOR ANALYTICS
-- =====================================================

-- Orders summary view
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as average_order_value,
  COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced_orders,
  COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN sync_status = 'failed' THEN 1 END) as failed_orders
FROM orders;

-- Recent orders view
CREATE OR REPLACE VIEW recent_orders AS
SELECT 
  o.*,
  m.shirt_length,
  m.chest,
  m.waist,
  m.trouser_length,
  m.trouser_waist
FROM orders o
LEFT JOIN measurements m ON o.id = m.order_id
ORDER BY o.created_at DESC
LIMIT 100;

-- =====================================================
-- 11. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show a completion message
DO $$
BEGIN
  RAISE NOTICE 'GarmentPOS database setup completed successfully!';
  RAISE NOTICE 'Tables created: orders, measurements, business_info, sync_log';
  RAISE NOTICE 'Storage bucket created: attachments';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Indexes created for performance optimization';
  RAISE NOTICE 'Views created: orders_summary, recent_orders';
END $$;
