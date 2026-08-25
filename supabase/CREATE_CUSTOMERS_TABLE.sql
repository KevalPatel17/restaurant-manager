-- ====================================================================
-- CREATE CUSTOMERS TABLE IN SUPABASE
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  table_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone for quick lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for cafe customers
DROP POLICY IF EXISTS "Allow public all on customers" ON public.customers;
CREATE POLICY "Allow public all on customers"
  ON public.customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reload Schema Cache in PostgREST
NOTIFY pgrst, 'reload schema';
