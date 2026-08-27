import { supabase } from './supabase';

/**
 * Direct Supabase API Service for Musafir Cafe (new-design)
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

  createTable: async (tableData) => {
    const { data, error } = await supabase
      .from('tables')
      .insert([
        {
          table_number: String(tableData.table_number),
          table_label: tableData.table_label || `Table #${tableData.table_number}`,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateTable: async (id, tableData) => {
    const { data, error } = await supabase
      .from('tables')
      .update(tableData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteTable: async (id) => {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  // 2. ORDER CREATION & TRACKING
  createOrder: async (orderPayload) => {
    const {
      table_number,
      customer_name,
      customer_phone,
      customer_mobile,
      items,
      special_instructions,
      payment_method,
    } = orderPayload;

    if (!table_number) throw new Error('Table number is required');
    if (!items || items.length === 0) throw new Error('Order must contain at least one item');

    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const mobileNumber = customer_mobile || customer_phone || null;

    // Step 1: Insert into orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          table_number: String(table_number),
          customer_name: customer_name || 'Musafir Guest',
          customer_phone: mobileNumber,
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
    // Fetch valid menu item IDs to avoid foreign key violations for reward items
    let validMenuItems = [];
    try {
      const { data } = await supabase.from('menu_items').select('id, name');
      if (data && data.length > 0) validMenuItems = data;
    } catch { }

    const defaultMenuItemId = validMenuItems[0]?.id || null;

    const orderItemsToInsert = items.map((item) => {
      const isReward = Boolean(item.is_reward_redemption || item.isReward);
      let targetMenuItemId = item.menu_item_id || item.id;

      // Ensure targetMenuItemId is a valid menu item in the database
      const isValid = validMenuItems.some((m) => m.id === targetMenuItemId);
      if (!isValid) {
        // Try finding by name or fallback to first valid menu item ID
        const matched = validMenuItems.find((m) =>
          m.name.toLowerCase().includes((item.name || '').toLowerCase())
        );
        targetMenuItemId = matched ? matched.id : defaultMenuItemId;
      }

      let customNote = item.customization || item.item_customization || '';
      if (isReward && !customNote.includes('🎁 [FREE REWARD]')) {
        customNote = `🎁 [FREE REWARD] ${item.name}${customNote ? ` | ${customNote}` : ''}`;
      }

      return {
        order_id: orderData.id,
        menu_item_id: targetMenuItemId,
        quantity: Number(item.quantity) || 1,
        price_at_order: Number(item.price || 0),
        item_customization: customNote,
        is_reward_redemption: isReward,
        original_price: Number(item.original_price || item.price || 0),
      };
    });

    // Try insert with reward columns, fallback if columns not yet in DB
    try {
      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)
        .select('*, menu_items(name, photo_url)');

      if (itemsError) throw itemsError;

      const createdOrder = {
        ...orderData,
        items: insertedItems,
      };

      // Broadcast instant cross-tab & local events (0ms latency)
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('musafir:new-order', { detail: createdOrder }));
          window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'NEW_ORDER', order: createdOrder } }));
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('musafir_orders_channel');
            bc.postMessage({ type: 'NEW_ORDER', order: createdOrder });
            bc.close();
          }
        } catch { }
      }

      return createdOrder;
    } catch (err) {
      console.warn('Fallback insert without reward columns:', err.message);
      const basicItems = orderItemsToInsert.map(({ is_reward_redemption, original_price, ...rest }) => rest);
      const { data: fallbackItems, error: fbError } = await supabase
        .from('order_items')
        .insert(basicItems)
        .select('*, menu_items(name, photo_url)');

      if (fbError) throw fbError;

      const createdOrder = {
        ...orderData,
        items: fallbackItems,
      };

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('musafir:new-order', { detail: createdOrder }));
          window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'NEW_ORDER', order: createdOrder } }));
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('musafir_orders_channel');
            bc.postMessage({ type: 'NEW_ORDER', order: createdOrder });
            bc.close();
          }
        } catch { }
      }

      return createdOrder;
    }
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
          is_reward_redemption,
          original_price,
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

    return (data || []).map((order) => ({
      ...order,
      items: (order.order_items || []).map((oi) => {
        const isReward = Boolean(oi.is_reward_redemption || (oi.item_customization && oi.item_customization.includes('🎁 [FREE REWARD]')));
        let displayName = oi.menu_items?.name || 'Artisan Dish';
        if (isReward && oi.item_customization) {
          const match = oi.item_customization.match(/🎁 \[FREE REWARD\] ([^|]+)/);
          if (match && match[1]) {
            displayName = match[1].trim();
          }
        }
        return {
          id: oi.id,
          name: displayName,
          photo_url: oi.menu_items?.photo_url,
          quantity: oi.quantity,
          price_at_order: oi.price_at_order,
          item_customization: oi.item_customization,
          is_reward_redemption: isReward,
          original_price: oi.original_price || oi.price_at_order || 0,
          prep_time_minutes: oi.menu_items?.prep_time_minutes || 8,
        };
      }),
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
          is_reward_redemption,
          original_price,
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
      items: (data.order_items || []).map((oi) => {
        const isReward = Boolean(oi.is_reward_redemption || (oi.item_customization && oi.item_customization.includes('🎁 [FREE REWARD]')));
        let displayName = oi.menu_items?.name || 'Artisan Dish';
        if (isReward && oi.item_customization) {
          const match = oi.item_customization.match(/🎁 \[FREE REWARD\] ([^|]+)/);
          if (match && match[1]) {
            displayName = match[1].trim();
          }
        }
        return {
          id: oi.id,
          name: displayName,
          photo_url: oi.menu_items?.photo_url,
          quantity: oi.quantity,
          price_at_order: oi.price_at_order,
          item_customization: oi.item_customization,
          is_reward_redemption: isReward,
          original_price: oi.original_price || oi.price_at_order || 0,
        };
      }),
    };
  },

  updateOrderStatus: async (orderId, status) => {
    // Notify instant local listeners (0ms cross-tab and in-tab sync)
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('musafir:order-status', { detail: { orderId, status } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('musafir_orders_channel');
          bc.postMessage({ type: 'ORDER_STATUS_CHANGED', orderId, status });
          bc.close();
        }
      } catch (e) {
        // ignore fallback
      }
    }

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
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'PAYMENT_UPDATED', orderId, paymentData } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('musafir_orders_channel');
          bc.postMessage({ type: 'PAYMENT_UPDATED', orderId, paymentData });
          bc.close();
        }
      } catch { }
    }

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
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId);
    } catch (e) {
      console.warn('order_items cleanup note:', e?.message);
    }
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'ORDERS_DELETED', orderId } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('musafir_orders_channel');
          bc.postMessage({ type: 'ORDERS_DELETED', orderId });
          bc.close();
        }
      } catch { }
    }

    return { success: true };
  },

  deleteOrders: async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return { success: true };
    try {
      await supabase.from('order_items').delete().in('order_id', orderIds);
    } catch (e) {
      console.warn('order_items batch cleanup note:', e?.message);
    }
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);

    if (error) throw error;

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'ORDERS_DELETED', orderIds } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('musafir_orders_channel');
          bc.postMessage({ type: 'ORDERS_DELETED', orderIds });
          bc.close();
        }
      } catch { }
    }

    return { success: true };
  },

  deleteAllOrders: async () => {
    try {
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('order_items delete all cleanup note:', e?.message);
    }
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('musafir:order-change', { detail: { type: 'ORDERS_DELETED' } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('musafir_orders_channel');
          bc.postMessage({ type: 'ORDERS_DELETED' });
          bc.close();
        }
      } catch { }
    }

    return { success: true };
  },

  // 3. GUEST CHECK-IN
  saveCustomerCheckin: async (customerData) => {
    try {
      const cleanPhone = String(customerData?.phone || customerData?.mobile || '').trim().replace(/\D/g, '').slice(-10);
      if (!cleanPhone && !customerData?.name) return null;

      if (cleanPhone) {
        const existing = await api.getCustomerByPhone(cleanPhone);
        if (existing?.id) {
          // Customer exists, update their latest table if needed
          if (customerData.table_number && existing.table_number !== customerData.table_number) {
            await supabase
              .from('customers')
              .update({ table_number: customerData.table_number, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          }
          return existing;
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.name || 'Musafir Guest',
          phone: cleanPhone || null,
          mobile: cleanPhone || null,
          travel_tokens: 0,
          table_number: customerData.table_number || '1',
          created_at: new Date().toISOString(),
        }])
        .select();

      if (error) {
        console.warn('Note on customers table checkin:', error.message);
      }
      return data?.[0] || null;
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

  // 5. CUSTOMER CAPTURE & TRAVEL TOKENS LOYALTY
  getCustomerByPhone: async (phone) => {
    if (!phone) return null;
    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`mobile.eq.${cleanPhone},phone.eq.${cleanPhone}`)
        .order('travel_tokens', { ascending: false });

      if (!error && data && data.length > 0) {
        // Pick the record with highest tokens or most recent
        const primary = data[0];

        // Clean up duplicate rows if multiple exist
        if (data.length > 1) {
          const duplicateIds = data.slice(1).map((d) => d.id);
          supabase.from('customers').delete().in('id', duplicateIds).then(() => {}).catch(() => {});
        }

        const customer = {
          ...primary,
          mobile: cleanPhone,
          phone: cleanPhone,
          travel_tokens: Number(primary.travel_tokens || 0),
        };
        api.cacheLocalCustomer(customer);
        return customer;
      }
    } catch (err) {
      console.warn('Customer lookup in DB notice:', err?.message);
    }

    try {
      const localCustomers = JSON.parse(localStorage.getItem('musafir_customers_db') || '[]');
      const match = localCustomers.find((c) => {
        const p = String(c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
      });
      if (match) return match;
    } catch { }

    return null;
  },

  createOrUpdateCustomer: async (customerData) => {
    const cleanPhone = String(customerData.mobile || customerData.phone || '').trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return null;

    // Check if customer already exists in DB
    const existing = await api.getCustomerByPhone(cleanPhone);
    if (existing) {
      // Return existing customer - NEVER overwrite their stored name
      return {
        ...existing,
        isExisting: true,
      };
    }

    // New customer: create with 0 tokens
    const newRecord = {
      name: customerData.name?.trim() || 'Musafir Guest',
      mobile: cleanPhone,
      phone: cleanPhone,
      travel_tokens: 0,
      table_number: customerData.table_number || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([newRecord])
        .select();

      if (!error && data && data.length > 0) {
        const created = {
          ...data[0],
          mobile: cleanPhone,
          phone: cleanPhone,
          travel_tokens: 0,
        };
        api.cacheLocalCustomer(created);
        return { ...created, isExisting: false };
      }
    } catch (err) {
      console.warn('DB insert customer notice:', err?.message);
    }

    api.cacheLocalCustomer(newRecord);
    return { ...newRecord, isExisting: false };
  },

  cacheLocalCustomer: (customer) => {
    try {
      const cleanPhone = String(customer.mobile || customer.phone || '').replace(/\D/g, '').slice(-10);
      const list = JSON.parse(localStorage.getItem('musafir_customers_db') || '[]');
      const filtered = list.filter((c) => {
        const p = String(c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
        return p !== cleanPhone;
      });
      localStorage.setItem('musafir_customers_db', JSON.stringify([{ ...customer, mobile: cleanPhone, phone: cleanPhone }, ...filtered]));
    } catch { }
  },

  updateCustomerTokens: async (phone, deltaTokens) => {
    const cleanPhone = String(phone).trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return null;

    const existing = await api.getCustomerByPhone(cleanPhone);
    const currentTokens = Number(existing?.travel_tokens || 0);
    const newBalance = Math.max(0, currentTokens + Number(deltaTokens));

    try {
      if (existing?.id) {
        // Update by primary key ID - safe and prevents 409 unique constraint errors
        const { data, error } = await supabase
          .from('customers')
          .update({
            travel_tokens: newBalance,
            mobile: cleanPhone,
            phone: cleanPhone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select();

        if (!error && data && data.length > 0) {
          const updated = {
            ...data[0],
            mobile: cleanPhone,
            phone: cleanPhone,
            travel_tokens: newBalance,
          };
          api.cacheLocalCustomer(updated);
          return updated;
        }
      } else {
        // Insert customer if not existing
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: 'Musafir Guest',
            mobile: cleanPhone,
            phone: cleanPhone,
            travel_tokens: newBalance,
            created_at: new Date().toISOString(),
          }])
          .select();

        if (!error && data && data.length > 0) {
          const created = {
            ...data[0],
            mobile: cleanPhone,
            phone: cleanPhone,
            travel_tokens: newBalance,
          };
          api.cacheLocalCustomer(created);
          return created;
        }
      }
    } catch (err) {
      console.warn('DB update tokens notice:', err?.message);
    }

    if (existing) {
      const updated = { ...existing, travel_tokens: newBalance, mobile: cleanPhone, phone: cleanPhone };
      api.cacheLocalCustomer(updated);
      return updated;
    }
    return null;
  },

  getAllCustomers: async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((c) => ({
          ...c,
          mobile: c.mobile || c.phone || 'N/A',
          travel_tokens: Number(c.travel_tokens || 0),
        }));
      }
    } catch (err) {
      console.warn('DB get customers notice:', err?.message);
    }

    try {
      return JSON.parse(localStorage.getItem('musafir_customers_db') || '[]');
    } catch {
      return [];
    }
  },

  deleteCustomer: async (identifier) => {
    if (!identifier) return false;
    const cleanPhone = String(identifier).replace(/\D/g, '').slice(-10);

    try {
      if (cleanPhone) {
        await supabase
          .from('customers')
          .delete()
          .or(`mobile.eq.${cleanPhone},phone.eq.${cleanPhone}`);
      } else {
        await supabase
          .from('customers')
          .delete()
          .eq('id', identifier);
      }
    } catch (err) {
      console.warn('DB delete customer notice:', err?.message);
    }

    // Local Storage cleanup
    try {
      const customers = JSON.parse(localStorage.getItem('musafir_customers_db') || '[]');
      const filtered = customers.filter((c) => {
        const cPhone = String(c.mobile || c.phone || '').replace(/\D/g, '').slice(-10);
        return c.id !== identifier && (!cleanPhone || cPhone !== cleanPhone);
      });
      localStorage.setItem('musafir_customers_db', JSON.stringify(filtered));
      if (cleanPhone) {
        localStorage.removeItem(`musafir_cust_${cleanPhone}`);
      }
    } catch (err) {
      console.warn('Local customer delete notice:', err);
    }

    return true;
  },

  deleteAllCustomers: async () => {
    try {
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('DB delete all customers notice:', err?.message);
    }
    localStorage.removeItem('musafir_customers_db');
    return true;
  },

  // 6. TOKEN RULES (Admin-Managed Earning Tiers)
  getTokenRules: async () => {
    const defaultRules = [
      { id: 'tr-1', min_order_amount: 500, tokens_awarded: 25 },
      { id: 'tr-2', min_order_amount: 1000, tokens_awarded: 50 },
      { id: 'tr-3', min_order_amount: 2000, tokens_awarded: 120 },
    ];

    try {
      const { data, error } = await supabase
        .from('token_rules')
        .select('*')
        .order('min_order_amount', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((r) => ({
          ...r,
          min_order_amount: Number(r.min_order_amount),
          tokens_awarded: Number(r.tokens_awarded),
        }));
      }
    } catch (err) {
      console.warn('Token rules DB notice:', err?.message);
    }

    try {
      const saved = localStorage.getItem('musafir_token_rules');
      return saved ? JSON.parse(saved) : defaultRules;
    } catch {
      return defaultRules;
    }
  },

  createTokenRule: async (ruleData) => {
    const newRule = {
      min_order_amount: Number(ruleData.min_order_amount),
      tokens_awarded: Number(ruleData.tokens_awarded),
    };

    try {
      const { data, error } = await supabase
        .from('token_rules')
        .insert([newRule])
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Create token rule DB notice:', err?.message);
    }

    const localRules = await api.getTokenRules();
    const mockRule = { id: `tr-${Date.now()}`, ...newRule };
    localStorage.setItem('musafir_token_rules', JSON.stringify([...localRules, mockRule]));
    return mockRule;
  },

  updateTokenRule: async (id, ruleData) => {
    const updatedRule = {
      min_order_amount: Number(ruleData.min_order_amount),
      tokens_awarded: Number(ruleData.tokens_awarded),
    };

    try {
      const { data, error } = await supabase
        .from('token_rules')
        .update(updatedRule)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Update token rule DB notice:', err?.message);
    }

    const localRules = await api.getTokenRules();
    const updatedList = localRules.map((r) => (r.id === id ? { ...r, ...updatedRule } : r));
    localStorage.setItem('musafir_token_rules', JSON.stringify(updatedList));
    return { id, ...updatedRule };
  },

  deleteTokenRule: async (id) => {
    try {
      await supabase.from('token_rules').delete().eq('id', id);
    } catch { }

    const localRules = await api.getTokenRules();
    const filtered = localRules.filter((r) => r.id !== id);
    localStorage.setItem('musafir_token_rules', JSON.stringify(filtered));
    return { success: true };
  },

  // 7. REWARD ITEMS (Admin-Managed Redeemable Free Catalog)
  getRewardItems: async (onlyActive = true) => {
    const defaultRewards = [
      {
        id: 'rw-1',
        name: 'Free Double Choc Artisan Cookie',
        points_cost: 100,
        active: true,
        description: 'Warm baked Belgian chocolate cookie with gooey center',
        image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'rw-2',
        name: 'Free Single-Origin Pour-Over Coffee',
        points_cost: 150,
        active: true,
        description: 'Signature Ethiopian Yirgacheffe freshly brewed pour-over',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'rw-3',
        name: 'Free Grilled Sourdough Panini Sandwich',
        points_cost: 250,
        active: true,
        description: 'Organic sourdough with melted artisanal cheese and roasted herbs',
        image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
      },
    ];

    try {
      let query = supabase.from('reward_items').select('*').order('points_cost', { ascending: true });
      if (onlyActive) {
        query = query.eq('active', true);
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          ...item,
          points_cost: Number(item.points_cost),
        }));
      }
    } catch (err) {
      console.warn('Reward items DB notice:', err?.message);
    }

    try {
      const saved = localStorage.getItem('musafir_reward_items');
      const list = saved ? JSON.parse(saved) : defaultRewards;
      return onlyActive ? list.filter((r) => r.active) : list;
    } catch {
      return onlyActive ? defaultRewards.filter((r) => r.active) : defaultRewards;
    }
  },

  createRewardItem: async (itemData) => {
    const newItem = {
      name: itemData.name,
      points_cost: Number(itemData.points_cost),
      active: itemData.active !== undefined ? Boolean(itemData.active) : true,
      description: itemData.description || '',
      image_url: itemData.image_url || '',
    };

    try {
      const { data, error } = await supabase
        .from('reward_items')
        .insert([newItem])
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Create reward item DB notice:', err?.message);
    }

    const localList = await api.getRewardItems(false);
    const mockItem = { id: `rw-${Date.now()}`, ...newItem };
    localStorage.setItem('musafir_reward_items', JSON.stringify([...localList, mockItem]));
    return mockItem;
  },

  updateRewardItem: async (id, itemData) => {
    const updated = {
      name: itemData.name,
      points_cost: Number(itemData.points_cost),
      active: Boolean(itemData.active),
      description: itemData.description || '',
      image_url: itemData.image_url || '',
    };

    try {
      const { data, error } = await supabase
        .from('reward_items')
        .update(updated)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Update reward item DB notice:', err?.message);
    }

    const localList = await api.getRewardItems(false);
    const updatedList = localList.map((r) => (r.id === id ? { ...r, ...updated } : r));
    localStorage.setItem('musafir_reward_items', JSON.stringify(updatedList));
    return { id, ...updated };
  },

  toggleRewardItemActive: async (id, active) => {
    try {
      const { data, error } = await supabase
        .from('reward_items')
        .update({ active: Boolean(active) })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
    } catch { }

    const localList = await api.getRewardItems(false);
    const updatedList = localList.map((r) => (r.id === id ? { ...r, active: Boolean(active) } : r));
    localStorage.setItem('musafir_reward_items', JSON.stringify(updatedList));
    return { id, active };
  },

  deleteRewardItem: async (id) => {
    try {
      await supabase.from('reward_items').delete().eq('id', id);
    } catch { }

    const localList = await api.getRewardItems(false);
    const filtered = localList.filter((r) => r.id !== id);
    localStorage.setItem('musafir_reward_items', JSON.stringify(filtered));
    return { success: true };
  },

  // 8. SOCIAL REELS (Admin-Managed External Link Videos - Instagram / YouTube Shorts / Direct Video)
  getSocialReels: async (onlyActive = false) => {
    const defaultReels = [
      {
        id: 'reel-1',
        title: 'Mastering the Swan Latte Art 🦢☕',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-cup-of-coffee-with-latte-art-42289-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
        platform: 'video',
        views_count: '14.2k',
        active: true,
      },
      {
        id: 'reel-2',
        title: 'Fresh Sourdough Baking at 6 AM 🥐🥖',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-baker-spreading-flour-on-a-table-42277-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        platform: 'video',
        views_count: '28.6k',
        active: true,
      },
      {
        id: 'reel-3',
        title: 'Pouring Single-Origin Iced Cold Brew 🧊',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-iced-coffee-served-with-ice-cubes-42296-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        platform: 'video',
        views_count: '19.8k',
        active: true,
      },
      {
        id: 'reel-4',
        title: 'Gooey Triple Chocolate Cookie Pull 🍫🍪',
        video_url: 'https://assets.mixkit.co/videos/preview/mixkit-cookies-with-melted-chocolate-pieces-42286-large.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
        platform: 'video',
        views_count: '42.1k',
        active: true,
      },
    ];

    try {
      let query = supabase.from('social_reels').select('*').order('created_at', { ascending: false });
      if (onlyActive) {
        query = query.eq('active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch { }

    const saved = localStorage.getItem('musafir_social_reels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (onlyActive) return parsed.filter((r) => r.active !== false);
        return parsed;
      } catch { }
    }

    return onlyActive ? defaultReels.filter((r) => r.active) : defaultReels;
  },

  createSocialReel: async (reelData) => {
    const newReel = {
      title: reelData.title || 'Musafir Cafe Reel',
      video_url: (reelData.video_url || '').trim(),
      thumbnail_url: reelData.thumbnail_url || '',
      platform: reelData.platform || 'video',
      views_count: reelData.views_count || '12.5k',
      active: true,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('social_reels')
        .insert([newReel])
        .select()
        .single();
      if (!error && data) return data;
    } catch { }

    const localList = await api.getSocialReels(false);
    const created = { id: `reel-${Date.now()}`, ...newReel };
    localList.unshift(created);
    localStorage.setItem('musafir_social_reels', JSON.stringify(localList));
    return created;
  },

  updateSocialReel: async (id, updatedData) => {
    try {
      const { data, error } = await supabase
        .from('social_reels')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch { }

    const localList = await api.getSocialReels(false);
    const updated = localList.map((r) => (r.id === id ? { ...r, ...updatedData } : r));
    localStorage.setItem('musafir_social_reels', JSON.stringify(updated));
    return { id, ...updatedData };
  },

  deleteSocialReel: async (id) => {
    try {
      await supabase.from('social_reels').delete().eq('id', id);
    } catch { }

    const localList = await api.getSocialReels(false);
    const filtered = localList.filter((r) => r.id !== id);
    localStorage.setItem('musafir_social_reels', JSON.stringify(filtered));
    return { success: true };
  },
};
