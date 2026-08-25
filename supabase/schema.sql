-- ==============================================================================
-- MUSAFIR CAFE — POSTGRESQL SCHEMA (SUPABASE)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-initializing
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;

-- 3. Create Tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(20) UNIQUE NOT NULL,
    table_label VARCHAR(50) DEFAULT 'Table',
    qr_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Coffee',
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    photo_url TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_special BOOLEAN DEFAULT FALSE,
    dietary_tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g. {'Vegan', 'Gluten-Free', 'Barista Pick'}
    prep_time_minutes INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    table_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100),
    status VARCHAR(30) DEFAULT 'New' NOT NULL, -- 'New', 'Preparing', 'Ready', 'Served', 'Cancelled'
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_order NUMERIC(10, 2) NOT NULL,
    item_customization TEXT, -- e.g. "Oat milk, less ice"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Public can read menu, place orders; Authenticated admin can manage)
CREATE POLICY "Public can view active tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view own order by id" ON orders FOR SELECT USING (true);
CREATE POLICY "Public can view order items" ON order_items FOR SELECT USING (true);

-- Admin Full Access Policies
CREATE POLICY "Admin full access on tables" ON tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Enable Realtime Replication for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
