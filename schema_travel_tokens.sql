-- ==============================================================================
-- MUSAFIR CAFE: CUSTOMER CAPTURE & "TRAVEL TOKENS" LOYALTY SYSTEM SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. CUSTOMERS TABLE (with Travel Tokens balance)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    travel_tokens INTEGER NOT NULL DEFAULT 0,
    table_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure travel_tokens column exists if customers table was already created earlier
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='travel_tokens') THEN
        ALTER TABLE public.customers ADD COLUMN travel_tokens INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='mobile') THEN
        ALTER TABLE public.customers ADD COLUMN mobile VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- 2. TOKEN RULES TABLE (Admin-Managed Earning Tiers)
CREATE TABLE IF NOT EXISTS public.token_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_order_amount NUMERIC(10, 2) NOT NULL,
    tokens_awarded INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. REWARD ITEMS TABLE (Admin-Managed Redeemable Free Items)
CREATE TABLE IF NOT EXISTS public.reward_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    points_cost INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. EXTEND ORDERS TABLE (Ensure customer_phone / customer_mobile exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_mobile') THEN
        ALTER TABLE public.orders ADD COLUMN customer_mobile VARCHAR(20);
    END IF;
END $$;

-- 5. EXTEND ORDER_ITEMS TABLE (For Free Reward Redemptions)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='is_reward_redemption') THEN
        ALTER TABLE public.order_items ADD COLUMN is_reward_redemption BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='original_price') THEN
        ALTER TABLE public.order_items ADD COLUMN original_price NUMERIC(10, 2) DEFAULT 0;
    END IF;
    -- Make menu_item_id nullable for custom reward redemptions
    ALTER TABLE public.order_items ALTER COLUMN menu_item_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already nullable
    NULL;
END $$;

-- 6. SEED DEFAULT TOKEN EARNING RULES (If empty)
INSERT INTO public.token_rules (min_order_amount, tokens_awarded)
SELECT 500, 25
WHERE NOT EXISTS (SELECT 1 FROM public.token_rules WHERE min_order_amount = 500);

INSERT INTO public.token_rules (min_order_amount, tokens_awarded)
SELECT 1000, 50
WHERE NOT EXISTS (SELECT 1 FROM public.token_rules WHERE min_order_amount = 1000);

INSERT INTO public.token_rules (min_order_amount, tokens_awarded)
SELECT 2000, 120
WHERE NOT EXISTS (SELECT 1 FROM public.token_rules WHERE min_order_amount = 2000);

-- 7. SEED DEFAULT REWARD ITEMS (If empty)
INSERT INTO public.reward_items (name, points_cost, active, description, image_url)
SELECT 'Free Double Choc Artisan Cookie', 100, true, 'Warm baked Belgian chocolate cookie with gooey center', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.reward_items WHERE name = 'Free Double Choc Artisan Cookie');

INSERT INTO public.reward_items (name, points_cost, active, description, image_url)
SELECT 'Free Single-Origin Pour-Over Coffee', 150, true, 'Signature Ethiopian Yirgacheffe freshly brewed pour-over', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.reward_items WHERE name = 'Free Single-Origin Pour-Over Coffee');

INSERT INTO public.reward_items (name, points_cost, active, description, image_url)
SELECT 'Free Grilled Sourdough Panini Sandwich', 250, true, 'Organic sourdough with melted artisanal cheese and roasted herbs', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80'
WHERE NOT EXISTS (SELECT 1 FROM public.reward_items WHERE name = 'Free Grilled Sourdough Panini Sandwich');

-- 8. PERMISSIONS & ROW LEVEL SECURITY (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access via anon key for the cafe ordering app
DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
CREATE POLICY "Allow public read customers" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update customers" ON public.customers;
CREATE POLICY "Allow public update customers" ON public.customers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete customers" ON public.customers;
CREATE POLICY "Allow public delete customers" ON public.customers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read token_rules" ON public.token_rules;
CREATE POLICY "Allow public read token_rules" ON public.token_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write token_rules" ON public.token_rules;
CREATE POLICY "Allow public write token_rules" ON public.token_rules FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read reward_items" ON public.reward_items;
CREATE POLICY "Allow public read reward_items" ON public.reward_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write reward_items" ON public.reward_items;
CREATE POLICY "Allow public write reward_items" ON public.reward_items FOR ALL USING (true);
