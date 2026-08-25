import { generateWhatsAppBillText } from '../utils/whatsappBill';
import { supabase } from './supabase';

/**
 * WAHA Direct & Cloud Delivery Engine for Musafir Cafe
 * Uses WAHA API Key authentication for direct local and cloud sending.
 */

const DEFAULT_WAHA_API_KEY = 'musafir123';

export const whatsappApi = {
  /**
   * Sends the digital bill to the customer's phone number
   * @param {Object} order The order object with customer_phone and items
   * @param {Object} cafeSettings Cafe settings with sender phone (+91 9537533472)
   */
  sendOneTimeBill: async (order, cafeSettings = {}) => {
    if (!order) return { success: false, error: 'No order provided' };

    const rawCustomerPhone = order.customer_phone || '';
    let customerPhone = rawCustomerPhone.replace(/\D/g, '');

    if (!customerPhone) {
      return { success: false, error: 'Customer mobile number is missing' };
    }

    if (customerPhone.length === 10) {
      customerPhone = `91${customerPhone}`;
    }

    const chatId = `${customerPhone}@c.us`;
    const wahaApiUrl = (cafeSettings.waha_api_url || 'http://localhost:3000').replace(/\/$/, '');
    const wahaSession = cafeSettings.waha_session || 'default';
    const wahaApiKey = cafeSettings.waha_api_key || DEFAULT_WAHA_API_KEY;
    const billMessage = generateWhatsAppBillText(order, cafeSettings);

    console.log(`📡 [WHATSAPP WAHA] Sending to ${chatId} via ${wahaApiUrl}...`);

    let delivered = false;
    let deliveryError = null;

    // STEP 1: Direct Fetch from Browser to WAHA with X-Api-Key
    try {
      const response = await fetch(`${wahaApiUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': wahaApiKey,
        },
        body: JSON.stringify({
          session: wahaSession,
          chatId: chatId,
          text: billMessage,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok) {
        console.log('✅ [WHATSAPP WAHA] Successfully delivered via direct WAHA fetch:', resData);
        delivered = true;
      } else {
        console.warn('⚠️ Direct WAHA returned error status:', response.status, resData);
        deliveryError = resData?.message || `HTTP ${response.status}: ${JSON.stringify(resData)}`;
      }
    } catch (directErr) {
      console.warn('⚠️ Direct browser fetch to WAHA failed (trying Edge Function):', directErr.message);
      deliveryError = directErr.message;
    }

    // STEP 2: Fallback to Supabase Edge Function
    if (!delivered) {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-test', {
          body: {
            phone: customerPhone,
            message: billMessage,
          },
        });

        if (data && data.success) {
          console.log('✅ [WHATSAPP WAHA] Delivered via Supabase Edge Function:', data);
          delivered = true;
        } else if (error || data?.results?.[0]?.error) {
          deliveryError = error?.message || data?.results?.[0]?.error || deliveryError;
        }
      } catch (fnErr) {
        deliveryError = fnErr.message;
      }
    }

    // STEP 3: Record delivery status in Supabase
    if (order.id && delivered) {
      try {
        await supabase
          .from('orders')
          .update({
            whatsapp_sent: true,
            whatsapp_sent_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      } catch {}
    }

    if (!delivered) {
      throw new Error(
        deliveryError || 'Could not connect to WAHA. Please ensure QR code is scanned in WAHA dashboard.'
      );
    }

    return {
      success: true,
      phone: customerPhone,
      chatId,
    };
  },

  sendAutomatedBill: function (order, cafeSettings) {
    return this.sendOneTimeBill(order, cafeSettings);
  },
};
