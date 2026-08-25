-- ====================================================================
-- ADD MISSING COLUMNS TO ORDERS TABLE & RELOAD SCHEMA CACHE
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- 1. Add customer details and WhatsApp tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Guest';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Create index for fast phone search
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
