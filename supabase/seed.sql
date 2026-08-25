-- ==============================================================================
-- MUSAFIR CAFE — SEED DATA (SIGNATURE MENU & TABLES)
-- ==============================================================================

-- Clear existing data
TRUNCATE order_items, orders, menu_items, categories, tables CASCADE;

-- 1. Insert Categories
INSERT INTO categories (id, name, icon_name, description, display_order) VALUES
('11111111-1111-1111-1111-111111111101', 'Artisanal Brews & Coffee', 'Coffee', 'Single-origin specialty roasts, slow pour-overs & handcrafted espresso', 1),
('11111111-1111-1111-1111-111111111102', 'Botanical Teas & Matcha', 'Leaf', 'Ceremonial grade Japanese matcha, aromatic blooming tisanes & chai', 2),
('11111111-1111-1111-1111-111111111103', 'All-Day Wanderer Brunch', 'Utensils', 'Artisan sourdough toasts, organic eggs, avocado bowls & savory treats', 3),
('11111111-1111-1111-1111-111111111104', 'Gourmet Sandwiches & Bites', 'Sandwich', 'Toasted sourdough paninis, woodfired bites and crispy sides', 4),
('11111111-1111-1111-1111-111111111105', 'Indulgent Bakery & Desserts', 'Cake', 'Freshly baked French croissants, artisanal cheesecakes & pastries', 5);

-- 2. Insert Menu Items
INSERT INTO menu_items (name, description, price, photo_url, category_id, is_available, is_special, dietary_tags, prep_time_minutes) VALUES
-- Artisanal Brews
('Musafir Signature Spanish Latte', 'Double shot Ethiopian espresso layered with condensed milk foam, steamed whole milk, and a dusting of Ceylon cinnamon.', 5.75, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111101', true, true, ARRAY['Barista Pick', 'Musafir Special'], 5),
('V60 Single-Origin Pour Over', 'Hand-poured Colombian Huila roast with bright notes of jasmine, peach nectar, and bergamot.', 6.25, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111101', true, false, ARRAY['Vegan', 'Barista Pick'], 7),
('Salted Caramel Cold Brew Crema', '18-hour steep Arabica cold brew topped with sea-salt infused Madagascar vanilla cold foam.', 5.50, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111101', true, false, ARRAY['Musafir Special'], 4),
('Velvet Flat White', 'Silky micro-foam poured over a rich double ristretto with notes of roasted hazelnut.', 4.85, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111101', true, false, ARRAY['Barista Pick'], 4),

-- Botanical Teas & Matcha
('Kyoto Ceremonial Iced Matcha Latte', 'First-harvest Uji ceremonial matcha whisked with creamy oat milk and organic agave.', 6.50, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111102', true, true, ARRAY['Vegan', 'Gluten-Free', 'Barista Pick'], 5),
('Wild Rose & Hibiscus Bloom Tisane', 'Infusion of dried Egyptian hibiscus petals, organic wild rosebuds, orange peel and mint leaves.', 4.95, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111102', true, false, ARRAY['Vegan', 'Gluten-Free'], 4),

-- Wanderer Brunch
('Truffle Mushroom Sourdough Toast', 'Sautéed wild forest mushrooms, thyme butter, creamy whipped goat cheese, truffle oil on toasted rustic sourdough.', 12.50, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111103', true, true, ARRAY['Vegetarian', 'Musafir Special'], 10),
('Classic Hass Avocado & Poached Egg Bowl', 'Fresh smashed avocado, heirloom cherry tomatoes, dukkah spices, two organic poached eggs on toasted country loaf.', 11.75, 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111103', true, false, ARRAY['Vegetarian'], 8),

-- Gourmet Sandwiches
('Smoked Pesto & Burrata Panini', 'Creamy Italian burrata, sundried tomatoes, homemade basil pistachio pesto, arugula in crispy ciabatta.', 13.25, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111104', true, false, ARRAY['Vegetarian'], 10),
('Artisan Garlic Parmesan Herb Fries', 'Crispy hand-cut Yukon potato fries tossed in fresh parsley, shaved parmesan and roasted garlic aioli.', 6.50, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111104', true, false, ARRAY['Vegetarian'], 6),

-- Bakery & Desserts
('San Sebastián Basque Burnt Cheesecake', 'Creamy caramelized Basque cheesecake with a molten center and warm berry compote.', 7.50, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111105', true, true, ARRAY['Vegetarian', 'Musafir Special'], 3),
('Toasted Almond Butter Croissant', 'Flaky 72-layer butter croissant filled with almond frangipane and topped with toasted flaked almonds.', 5.25, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80', '11111111-1111-1111-1111-111111111105', true, false, ARRAY['Vegetarian'], 2);

-- 3. Insert Tables
INSERT INTO tables (table_number, table_label) VALUES
('1', 'Cozy Window Seat 1'),
('2', 'Cozy Window Seat 2'),
('3', 'Garden Patio 3'),
('4', 'Garden Patio 4'),
('5', 'Traveler High Table 5'),
('6', 'Terrace Lounge 6');
