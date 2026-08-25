// Supabase Edge Function: notify-new-order
// Self-contained single-file (No external local shared files needed)
// Triggered by: Supabase Database Webhook (INSERT on `orders` table)
// Runtime: Deno (TypeScript)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// 1. CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// 2. WAHA Helper Functions
function formatWahaChatId(rawPhone: string): string {
  let clean = rawPhone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return `${clean}@c.us`;
}

async function sendWahaMessage(recipients: string[], messageText: string) {
  const wahaApiUrl = Deno.env.get('WAHA_API_URL')?.replace(/\/$/, '') || 'http://localhost:3000';
  const wahaSession = Deno.env.get('WAHA_SESSION') || 'default';
  const results = [];

  for (const rawNumber of recipients) {
    const trimmed = rawNumber.trim();
    if (!trimmed) continue;

    const chatId = formatWahaChatId(trimmed);
    console.log(`[WAHA] Sending message to ${chatId}...`);

    try {
      const response = await fetch(`${wahaApiUrl}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          session: wahaSession,
          chatId: chatId,
          text: messageText,
        }),
      });

      const responseBody = await response.json().catch(() => ({}));
      results.push({
        recipient: trimmed,
        chatId,
        success: response.ok,
        data: responseBody,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[WAHA] Error sending to ${chatId}:`, errorMsg);
      results.push({
        recipient: trimmed,
        chatId,
        success: false,
        error: errorMsg,
      });
    }
  }

  return results;
}

// 3. Database Webhook Payload Interface
interface DatabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    order_number?: number;
    table_number: string;
    customer_name?: string;
    customer_phone?: string;
    total: number;
    special_instructions?: string;
    created_at: string;
    status: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[notify-new-order] Webhook received!');

    const payload: DatabaseWebhookPayload = await req.json().catch(() => ({}));
    const order = payload.record || (payload as unknown as DatabaseWebhookPayload['record']);

    if (!order || !order.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'No order record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[notify-new-order] Order ID: ${order.id}, Table: #${order.table_number}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order items with menu item names
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price_at_order, item_customization, menu_items(name)')
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('[notify-new-order] Error fetching order items:', itemsError.message);
    }

    let itemsText = '';
    if (items && items.length > 0) {
      itemsText = items
        .map((item: any) => {
          const name = item.menu_items?.name || 'Artisan Dish';
          const qty = item.quantity || 1;
          const price = Number(item.price_at_order || 0) * qty;
          const custom = item.item_customization ? `\n   _Note: ${item.item_customization}_` : '';
          return `- x${qty}  ${name} — ₹${price.toFixed(2)}${custom}`;
        })
        .join('\n');
    } else {
      itemsText = `- 1x Custom Table Order — ₹${Number(order.total || 0).toFixed(2)}`;
    }

    const orderDate = order.created_at ? new Date(order.created_at) : new Date();
    const timeFormatted = orderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const orderNumberFormatted = order.order_number
      ? String(order.order_number)
      : order.id.slice(0, 5);

    // Formatted WhatsApp message string
    const message = `🍽️ *NEW ORDER*
━━━━━━━━━━━━━━━━━━━
📍 *Table:* ${order.table_number || 'N/A'}
🕐 *Time:* ${timeFormatted}
🔢 *Order #:* ${orderNumberFormatted}
👤 *Guest:* ${order.customer_name || 'Guest'}

*Items:*
${itemsText}

${order.special_instructions ? `💬 *Note:* ${order.special_instructions}\n` : ''}💰 *Total: ₹${Number(order.total || 0).toFixed(2)}*
━━━━━━━━━━━━━━━━━━━
_Sent from Restaurant POS_`;

    const rawNumbers = Deno.env.get('RESTAURANT_WHATSAPP_NUMBERS') || '919537533472';
    const recipientList = rawNumbers.split(',').map((n) => n.trim()).filter(Boolean);

    if (order.customer_phone && !recipientList.includes(order.customer_phone)) {
      recipientList.push(order.customer_phone);
    }

    const sendResults = await sendWahaMessage(recipientList, message);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        recipients: recipientList,
        results: sendResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[notify-new-order] Error:', errorMsg);

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
