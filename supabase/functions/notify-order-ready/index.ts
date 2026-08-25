// Supabase Edge Function: notify-order-ready
// Self-contained single-file (No external local shared files needed)
// Triggered by: Supabase Database Webhook (UPDATE on `orders` table when status changes to "ready")
// Runtime: Deno (TypeScript)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

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
    console.log(`[WAHA] Sending Ready notification to ${chatId}...`);

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

// 3. Webhook Payload Interface
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
    status: string;
    total: number;
    updated_at?: string;
  };
  old_record?: {
    id: string;
    status?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[notify-order-ready] Webhook triggered on order update!');

    const payload: DatabaseWebhookPayload = await req.json().catch(() => ({}));
    const record = payload.record || (payload as unknown as DatabaseWebhookPayload['record']);

    if (!record || !record.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'No order record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentStatus = (record.status || '').toLowerCase().trim();

    // Verify status is "ready"
    if (currentStatus !== 'ready') {
      console.log(`[notify-order-ready] Status is '${record.status}', skipping notification.`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: `Status is '${record.status}', not 'ready'`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderNumFormatted = record.order_number
      ? String(record.order_number)
      : record.id.slice(0, 5);

    // Build the WhatsApp message
    const message = `✅ *ORDER READY TO SERVE!*
━━━━━━━━━━━━━━━━━━━
📍 *Table:* ${record.table_number || 'N/A'}
🔢 *Order #:* ${orderNumFormatted}
👤 *Guest:* ${record.customer_name || 'Guest'}
🛎️ Please serve this order now!
━━━━━━━━━━━━━━━━━━━
_Kitchen Display — Restaurant POS_`;

    const rawNumbers = Deno.env.get('RESTAURANT_WHATSAPP_NUMBERS') || '919537533472';
    const recipientList = rawNumbers.split(',').map((n) => n.trim()).filter(Boolean);

    if (record.customer_phone && !recipientList.includes(record.customer_phone)) {
      recipientList.push(record.customer_phone);
    }

    const sendResults = await sendWahaMessage(recipientList, message);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: record.id,
        status: record.status,
        results: sendResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[notify-order-ready] Error:', errorMsg);

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
