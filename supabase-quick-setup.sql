-- =====================================================
-- GarmentPOS - Quick Supabase Setup
-- Copy and paste this into Supabase SQL Editor
-- =====================================================

-- 1. Create Orders Table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT,
  return_date DATE,
  notes TEXT,
  advance DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  picture_url TEXT,
  sync_status TEXT DEFAULT 'pending',
  sync_attempts INTEGER DEFAULT 0,
  sync_error TEXT,
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Measurements Table
CREATE TABLE measurements (
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
  sync_status TEXT DEFAULT 'pending',
  sync_attempts INTEGER DEFAULT 0,
  sync_error TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Business Info Table
CREATE TABLE business_info (
  id SERIAL PRIMARY KEY,
  shop_name TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Sync Log Table
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (Allow all for authenticated users)
CREATE POLICY "Enable all for authenticated users" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON measurements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON business_info FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON sync_log FOR ALL USING (auth.role() = 'authenticated');

-- 7. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);

-- 8. Storage Policies
CREATE POLICY "Enable all for authenticated users" ON storage.objects FOR ALL USING (auth.role() = 'authenticated');

-- 9. Insert Sample Business Info
INSERT INTO business_info (shop_name, phone, address) VALUES ('GarmentPOS Store', '+91-9876543210', '123 Main Street, City');

-- Success Message
SELECT 'GarmentPOS database setup completed!' as message;
