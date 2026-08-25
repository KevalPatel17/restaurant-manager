/**
 * WAHA (WhatsApp HTTP API) Helper for Supabase Edge Functions
 * Documentation: https://waha.devlike.pro/
 */

export interface WahaSendResult {
  recipient: string;
  chatId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Format any raw phone number string into WAHA chatId format:
 * Example: "9537533472" -> "919537533472@c.us"
 * Example: "+91 98765-43210" -> "919876543210@c.us"
 */
export function formatWahaChatId(rawPhone: string): string {
  // Remove all non-numeric characters (spaces, +, -, parentheses)
  let clean = rawPhone.replace(/\D/g, '');

  // If 10 digits (Standard Indian Mobile number), prepend country code 91
  if (clean.length === 10) {
    clean = `91${clean}`;
  }

  // WAHA requires @c.us suffix for direct individual WhatsApp chats
  return `${clean}@c.us`;
}

/**
 * Send a WhatsApp text message to one or multiple recipients using WAHA API
 */
export async function sendWahaMessage(
  recipients: string[],
  messageText: string
): Promise<WahaSendResult[]> {
  // Retrieve environment variables configured in Supabase Secrets
  const wahaApiUrl = Deno.env.get('WAHA_API_URL')?.replace(/\/$/, '') || 'http://localhost:3000';
  const wahaSession = Deno.env.get('WAHA_SESSION') || 'default';

  const results: WahaSendResult[] = [];

  for (const rawNumber of recipients) {
    const trimmed = rawNumber.trim();
    if (!trimmed) continue;

    const chatId = formatWahaChatId(trimmed);

    console.log(`[WAHA] Sending message via ${wahaApiUrl}/api/sendText to ${chatId} (session: ${wahaSession})...`);

    try {
      // WAHA POST /api/sendText endpoint
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

      if (!response.ok) {
        console.error(`[WAHA] Failed sending to ${chatId}: HTTP ${response.status}`, responseBody);
        results.push({
          recipient: trimmed,
          chatId,
          success: false,
          error: `HTTP ${response.status}: ${JSON.stringify(responseBody)}`,
        });
      } else {
        console.log(`[WAHA] Message successfully delivered to ${chatId}`);
        results.push({
          recipient: trimmed,
          chatId,
          success: true,
          data: responseBody,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[WAHA] Network / Connection error sending to ${chatId}:`, errorMsg);
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
