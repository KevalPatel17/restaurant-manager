// Supabase Edge Function: whatsapp-test
// Self-contained single-file (No external local shared files needed)
// Triggered by: Direct HTTP POST from React Admin Panel (`supabase.functions.invoke('whatsapp-test')`)
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
  const wahaApiKey = Deno.env.get('WAHA_API_KEY') || 'b71243a6e85a4fc0b325b7d698010ec9';
  const results = [];

  for (const rawNumber of recipients) {
    const trimmed = rawNumber.trim();
    if (!trimmed) continue;

    const chatId = formatWahaChatId(trimmed);
    console.log(`[WAHA] Sending test to ${chatId}...`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (wahaApiKey) {
        headers['X-Api-Key'] = wahaApiKey;
      }

      const response = await fetch(`${wahaApiUrl}/api/sendText`, {
        method: 'POST',
        headers,
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

interface TestRequestBody {
  phone?: string;
  message?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-test] Test WhatsApp function invoked from Admin Panel!');

    const body: TestRequestBody = await req.json().catch(() => ({}));

    const rawNumbers = body.phone || Deno.env.get('RESTAURANT_WHATSAPP_NUMBERS') || '919537533472';
    const recipientList = rawNumbers.split(',').map((n) => n.trim()).filter(Boolean);

    if (recipientList.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No recipient phone numbers configured or provided.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const testTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const message = body.message || `🧪 *WAHA WHATSAPP CONNECTION TEST*
━━━━━━━━━━━━━━━━━━━
✅ *Status:* Connected Successfully!
🕐 *Timestamp:* ${testTime}
📡 *Engine:* Supabase Edge Functions + WAHA API
📱 *Session:* ${Deno.env.get('WAHA_SESSION') || 'default'}
━━━━━━━━━━━━━━━━━━━
_Musafir Cafe Restaurant POS_`;

    const sendResults = await sendWahaMessage(recipientList, message);
    const hasFailed = sendResults.some((r) => !r.success);

    return new Response(
      JSON.stringify({
        success: !hasFailed,
        recipients: recipientList,
        results: sendResults,
        wahaApiUrl: Deno.env.get('WAHA_API_URL') || 'http://localhost:3000',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[whatsapp-test] Error:', errorMsg);

    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
