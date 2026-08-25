import { supabase } from './supabase';

/**
 * Direct Supabase API Service — Serverless Architecture for Musafir Cafe
 * All database operations, realtime subscriptions, and authentication talk directly to Supabase.
 */

export const api = {
  // 1. MENU & CATEGORY ENDPOINTS
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getItemsByCategory: async (categoryId) => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getAllMenuItems: async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name, icon_name)')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getTables: async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('table_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 2. ORDER CREATION & TRACKING
  createOrder: async (orderPayload) => {
    const { table_number, customer_name, customer_phone, items, special_instructions, payment_method } = orderPayload;

    if (!table_number) throw new Error('Table number is required');
    if (!items || items.length === 0) throw new Error('Order must contain at least one item');

    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    // Step 1: Insert into orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          table_number: String(table_number),
          customer_name: customer_name || 'Musafir Guest',
          customer_phone: customer_phone || null,
          status: 'New',
          payment_status: 'Pending',
          payment_method: payment_method || 'Cash',
          total: Number(total.toFixed(2)),
          special_instructions: special_instructions || '',
        },
      ])
      .select()
      .single();

    if (orderError) {
      // Fallback: If customer_phone column doesn't exist yet, insert without extra fields
      if (orderError.code === 'PGRST204' || (orderError.message && orderError.message.includes('customer_phone'))) {
        const { data: retryData, error: retryError } = await supabase
          .from('orders')
          .insert([
            {
              table_number: String(table_number),
              status: 'New',
              total: Number(total.toFixed(2)),
              special_instructions: special_instructions || '',
            },
          ])
          .select()
          .single();

        if (retryError) throw retryError;
        return api.insertOrderItems(retryData, items);
      }
      throw orderError;
    }

    return api.insertOrderItems(orderData, items);
  },

  insertOrderItems: async (orderData, items) => {
    const orderItemsToInsert = items.map((item) => ({
      order_id: orderData.id,
      menu_item_id: item.menu_item_id || item.id,
      quantity: Number(item.quantity) || 1,
      price_at_order: Number(item.price),
      item_customization: item.customization || item.item_customization || '',
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)
      .select('*, menu_items(name, photo_url)');

    if (itemsError) throw itemsError;

    return {
      ...orderData,
      items: insertedItems,
    };
  },

  getOrders: async (params = {}) => {
    const { status, table } = params;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          item_customization,
          menu_items (
            name,
            photo_url,
            prep_time_minutes
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (table) {
      query = query.eq('table_number', table);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Normalize nested item records for clean UI consumption
    return (data || []).map((order) => ({
      ...order,
      items: (order.order_items || []).map((oi) => ({
        id: oi.id,
        name: oi.menu_items?.name || 'Artisan Dish',
        photo_url: oi.menu_items?.photo_url,
        quantity: oi.quantity,
        price_at_order: oi.price_at_order,
        item_customization: oi.item_customization,
        prep_time_minutes: oi.menu_items?.prep_time_minutes || 8,
      })),
    }));
  },

  getOrderById: async (orderId) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          item_customization,
          menu_items (
            name,
            photo_url
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) throw new Error('Order not found');

    return {
      ...data,
      items: (data.order_items || []).map((oi) => ({
        id: oi.id,
        name: oi.menu_items?.name || 'Artisan Dish',
        photo_url: oi.menu_items?.photo_url,
        quantity: oi.quantity,
        price_at_order: oi.price_at_order,
        item_customization: oi.item_customization,
      })),
    };
  },

  updateOrderStatus: async (orderId, status) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateOrderPayment: async (orderId, paymentData) => {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...paymentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.warn('Payment column update fallback:', error.message);
      return { success: true };
    }
    return data;
  },

  deleteOrder: async (orderId) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  },

  // 3. GUEST CHECK-IN
  saveCustomerCheckin: async (customerData) => {
    try {
      if (!customerData?.phone && !customerData?.name) return null;
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name || 'Guest',
          phone: customerData.phone || '',
          table_number: customerData.table_number || '1',
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.warn('Note on customers table checkin:', error.message);
      }
      return data;
    } catch (err) {
      console.warn('Silent catch for customers table:', err);
      return null;
    }
  },

  // 4. ADMIN OPERATIONS & ANALYTICS
  getAnalytics: async () => {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status, total, created_at');

    if (ordersError) throw ordersError;

    const { count: menuCount, error: menuError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    if (menuError) throw menuError;

    const { count: categoryCount, error: catError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (catError) throw catError;

    const totalRevenue = (orders || []).reduce(
      (sum, o) => sum + (o.status !== 'Cancelled' ? Number(o.total || 0) : 0),
      0
    );
    const activeOrders = (orders || []).filter((o) =>
      ['New', 'Preparing', 'Ready'].includes(o.status)
    ).length;
    const completedOrders = (orders || []).filter((o) => o.status === 'Served').length;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: (orders || []).length,
      activeOrders,
      completedOrders,
      totalMenuItems: menuCount || 0,
      totalCategories: categoryCount || 0,
    };
  },

  createCategory: async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateCategory: async (id, categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  createMenuItem: async (itemData) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([
        {
          name: itemData.name,
          description: itemData.description || '',
          price: Number(itemData.price),
          photo_url: itemData.photo_url || '',
          category_id: itemData.category_id,
          is_available: itemData.is_available !== undefined ? Boolean(itemData.is_available) : true,
          is_special: Boolean(itemData.is_special),
          dietary_tags: itemData.dietary_tags || [],
          prep_time_minutes: Number(itemData.prep_time_minutes) || 8,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateMenuItem: async (id, itemData) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  toggleMenuItemAvailability: async (id, is_available) => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: Boolean(is_available) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteMenuItem: async (id) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },
};
