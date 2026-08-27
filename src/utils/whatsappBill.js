/**
 * WhatsApp Digital Bill Formatter & Dispatcher for Musafir Cafe
 * Generates formatted text invoices and opens WhatsApp Click-to-Chat
 */

export function generateWhatsAppBillText(order, cafeSettings = {}) {
  const cafeName = cafeSettings.cafe_name || 'MUSAFIR CAFE & ROASTERS';
  const cafePhone = cafeSettings.cafe_phone || '+91 75554 17487';
  const cafeAddress = cafeSettings.cafe_address || 'Sanctuary Lane, Wanderer Street';
  const cafeGst = cafeSettings.cafe_gst || '27AABCU9603R1ZM';

  const orderNum = order.order_number ? String(order.order_number).padStart(4, '0') : (order.id ? order.id.slice(0, 6) : '0001');
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : new Date().toLocaleString();

  const isPaid = order.payment_status === 'Paid';
  const tax = Number((Number(order.total || 0) * 0.05).toFixed(2));
  const subtotal = Number((Number(order.total || 0) - tax).toFixed(2));

  let itemsList = '';
  if (order.items && order.items.length > 0) {
    itemsList = order.items
      .map((item) => {
        const itemLine = `• *${item.quantity}x ${item.name}* — ₹${(Number(item.price_at_order || item.price || 0) * item.quantity).toFixed(2)}`;
        const custom = item.item_customization || item.customization;
        const customLine = custom ? `\n  _Notes: ${custom}_` : '';
        return `${itemLine}${customLine}`;
      })
      .join('\n');
  } else {
    itemsList = `• 1x Cafe Specialty Order — ₹${Number(order.total || 0).toFixed(2)}`;
  }

  const message = `☕ *${cafeName.toUpperCase()}*
_${cafeAddress}_
━━━━━━━━━━━━━━━━━━━━
📋 *DIGITAL TAX INVOICE*
🧾 *Invoice #:* INV-${orderNum}
📅 *Date:* ${dateStr}
🪑 *Table:* Table #${order.table_number || '1'}
👤 *Guest:* ${order.customer_name || 'Musafir Guest'}
📞 *Phone:* ${order.customer_phone || 'N/A'}
━━━━━━━━━━━━━━━━━━━━
☕ *ORDER DETAILS:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ₹${subtotal}
🧾 *Cafe Tax (5%):* ₹${tax}
💰 *TOTAL AMOUNT:* ₹${Number(order.total || 0).toFixed(2)}

${isPaid ? '🟢 *PAYMENT STATUS: PAID IN FULL ✓*' : '🟡 *PAYMENT STATUS: PENDING*'}
💳 *Payment Method:* ${order.payment_method || 'Cash / GPay'}
━━━━━━━━━━━━━━━━━━━━
GSTIN: ${cafeGst} | Support: ${cafePhone}

🙏 _Thank you for sharing your journey with Musafir Cafe. Have a wonderful day & safe travels!_ 🌿`;

  return message;
}

export function sendWhatsAppBill(order, cafeSettings = {}, autoOpen = true) {
  if (!order) return null;

  const rawPhone = order.customer_phone || '';
  let cleanPhone = rawPhone.replace(/\D/g, '');

  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const billText = generateWhatsAppBillText(order, cafeSettings);
  const encodedMessage = encodeURIComponent(billText);

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  if (autoOpen && typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }

  return { whatsappUrl, billText, cleanPhone };
}
