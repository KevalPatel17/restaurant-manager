// Supabase Edge Function: daily-summary
// Self-contained single-file (No external local shared files needed)
// Triggered by: Supabase pg_cron (Every night at 11:00 PM IST / 17:30 UTC) or manual invocation
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
    console.log(`[WAHA] Sending daily summary to ${chatId}...`);

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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[daily-summary] Generating daily summary report...');

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const startOfDay = `${todayDateStr}T00:00:00.000Z`;
    const endOfDay = `${todayDateStr}T23:59:59.999Z`;

    // Query today's orders
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (ordersError) {
      console.error('[daily-summary] Error querying orders:', ordersError.message);
      throw ordersError;
    }

    const allOrders = todayOrders || [];
    const totalOrdersCount = allOrders.length;

    const completedOrders = allOrders.filter((o) => {
      const s = (o.status || '').toLowerCase();
      return s === 'served' || s === 'completed' || s === 'ready';
    });

    const pendingOrders = allOrders.filter((o) => {
      const s = (o.status || '').toLowerCase();
      return s === 'new' || s === 'preparing';
    });

    const totalRevenue = allOrders.reduce((sum, order) => {
      if ((order.status || '').toLowerCase() === 'cancelled') return sum;
      return sum + Number(order.total || 0);
    }, 0);

    // Calculate Top Most-Ordered Item
    let topItemText = 'None';
    if (allOrders.length > 0) {
      const orderIds = allOrders.map((o) => o.id);

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity, menu_items(name)')
        .in('order_id', orderIds);

      if (!itemsError && orderItems && orderItems.length > 0) {
        const itemCountMap: Record<string, number> = {};

        for (const item of orderItems as any[]) {
          const itemName = item.menu_items?.name || 'Specialty Dish';
          const qty = Number(item.quantity) || 1;
          itemCountMap[itemName] = (itemCountMap[itemName] || 0) + qty;
        }

        let maxCount = 0;
        let bestItem = '';
        for (const [name, count] of Object.entries(itemCountMap)) {
          if (count > maxCount) {
            maxCount = count;
            bestItem = name;
          }
        }

        if (bestItem) {
          topItemText = `${bestItem} (${maxCount}x)`;
        }
      }
    }

    const formattedDate = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Build WhatsApp Message
    const message = `📊 *DAILY SUMMARY*
📅 ${formattedDate}
━━━━━━━━━━━━━━━━━━━
📦 Total Orders: ${totalOrdersCount}
💰 Total Revenue: ₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
✅ Completed: ${completedOrders.length}
⏳ Pending: ${pendingOrders.length}
🏆 Top Item: ${topItemText}
━━━━━━━━━━━━━━━━━━━
_Restaurant POS Auto Report_`;

    const rawNumbers = Deno.env.get('RESTAURANT_WHATSAPP_NUMBERS') || '919537533472';
    const recipientList = rawNumbers.split(',').map((n) => n.trim()).filter(Boolean);

    const sendResults = await sendWahaMessage(recipientList, message);

    return new Response(
      JSON.stringify({
        success: true,
        date: todayDateStr,
        summary: {
          totalOrders: totalOrdersCount,
          totalRevenue,
          completed: completedOrders.length,
          pending: pendingOrders.length,
          topItem: topItemText,
        },
        results: sendResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[daily-summary] Error:', errorMsg);

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
