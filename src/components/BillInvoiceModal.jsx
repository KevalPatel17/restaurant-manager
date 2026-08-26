import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Smartphone, DollarSign, Receipt, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import GPayPaymentModal from './GPayPaymentModal';
import { whatsappApi } from '../lib/whatsappApi';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export default function BillInvoiceModal({ isOpen, onClose, order, onStatusUpdated }) {
  const { cafeSettings } = useCart();
  const [showGPayModal, setShowGPayModal] = useState(false);
  const [phonePrompt, setPhonePrompt] = useState(false);
  const [inputPhone, setInputPhone] = useState(order?.customer_phone || '');

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    const phoneToSend = order.customer_phone || inputPhone;
    if (!phoneToSend) {
      setPhonePrompt(true);
      return;
    }

    const orderWithPhone = {
      ...order,
      customer_phone: phoneToSend,
    };

    try {
      await whatsappApi.sendOneTimeBill(orderWithPhone, cafeSettings);
      toast.success(`Digital Bill sent to +${phoneToSend} from +91 9537533472!`);
      setPhonePrompt(false);
    } catch (err) {
      toast.error('Failed to send WhatsApp message');
    }
  };

  const handleMarkCashPaid = async () => {
    try {
      await api.updateOrderPayment(order.id, {
        payment_method: 'Cash',
        payment_status: 'Paid',
      });

      const paidOrder = {
        ...order,
        payment_method: 'Cash',
        payment_status: 'Paid',
      };

      if (cafeSettings?.auto_send_whatsapp_bill && paidOrder.customer_phone) {
        whatsappApi.sendAutomatedBill(paidOrder, cafeSettings, 'bill_paid').catch(() => {});
      }

      toast.success('Marked as Paid in Cash');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      toast.error('Failed to update cash payment status');
    }
  };

  const isPaid = order.payment_status === 'Paid';
  const tax = Number((Number(order.total) * 0.05).toFixed(2));
  const subtotal = Number((Number(order.total) - tax).toFixed(2));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
        <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
          
          {/* Header Controls (Hidden during print) */}
          <div className="p-4 bg-green text-white flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-white/90" />
              <span className="font-serif font-bold text-base">Musafir Cafe Tax Invoice</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Invoice Container */}
          <div id="cafe-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#2A2521] text-xs font-sans print:p-4 bg-white">
            
            {/* Cafe Brand Header */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-border pb-5">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-border mx-auto mb-1 p-0.5 bg-white">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="font-serif text-2xl font-black text-[#1E130D] tracking-tight">
                {cafeSettings.cafe_name || 'Musafir Cafe'}
              </h2>
              <p className="text-muted text-[11px] max-w-xs mx-auto">
                {cafeSettings.cafe_address || 'Sanctuary Lane, Wanderer Street'}
              </p>
              <p className="text-muted text-[10px]">
                Phone: {cafeSettings.cafe_phone || '+91 95375 33472'} • GSTIN: {cafeSettings.cafe_gst || '27AABCU9603R1ZM'}
              </p>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-3 bg-[#FAF8F4] p-4 rounded-2xl border border-border">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold block">Invoice #</span>
                <span className="font-mono font-bold text-[#1E130D] text-sm">
                  INV-{order.order_number ? String(order.order_number).padStart(4, '0') : (order.id ? order.id.slice(0, 6) : '0001')}
                </span>
                <span className="text-[10px] text-muted block mt-1">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted uppercase font-bold block">Dining Table</span>
                <span className="font-serif font-black text-base text-green block">
                  Table #{order.table_number}
                </span>
                <span className="font-semibold text-[11px] text-[#1E130D] block mt-0.5">
                  Guest: {order.customer_name || 'Musafir Guest'}
                </span>
                {order.customer_phone && (
                  <span className="text-[10px] text-muted block font-mono">
                    Ph: {order.customer_phone}
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1E130D] text-[#1E130D] font-bold text-[11px] uppercase pb-2">
                    <th className="pb-2">Qty & Item</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="py-2.5">
                      <td className="py-2">
                        <span className="font-bold text-[#1E130D] text-xs">
                          {item.quantity}x {item.name}
                        </span>
                        {item.item_customization && (
                          <span className="block text-[10px] text-green italic">
                            "{item.item_customization}"
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right text-muted font-mono">
                        ${Number(item.price_at_order || item.price || 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-bold text-[#1E130D] font-mono">
                        ${(Number(item.price_at_order || item.price || 0) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Calculations */}
            <div className="border-t-2 border-dashed border-border pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal</span>
                <span className="font-mono">${subtotal}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Cafe GST / Service Tax (5%)</span>
                <span className="font-mono">${tax}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#1E130D] pt-2 border-t border-border">
                <span>Total Amount Due</span>
                <span className="font-serif text-lg text-green font-black font-mono">
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Status Stamp */}
            <div className="p-3.5 rounded-2xl flex items-center justify-between border text-xs font-bold"
              style={{
                backgroundColor: isPaid ? '#F0FDF4' : '#FFFBEB',
                borderColor: isPaid ? '#86EFAC' : '#FDE68A',
                color: isPaid ? '#15803D' : '#B45309',
              }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Status: {isPaid ? 'PAID IN FULL ✓' : 'PENDING PAYMENT'}</span>
              </div>
              <span>{order.payment_method || 'Cash / GPay'}</span>
            </div>

            {phonePrompt && (
              <div className="p-3 bg-[#FAF8F4] border border-[#25D366]/40 rounded-2xl space-y-2 animate-slide-up">
                <label className="block text-[11px] font-bold text-[#1E130D]">
                  Enter WhatsApp Number to send bill:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. 9537533472"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-white font-mono"
                    autoFocus
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow"
                  >
                    <span>Send</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer Blessing */}
            <div className="text-center pt-2 text-muted text-[10px] space-y-0.5 border-t border-border">
              <p className="font-serif italic font-bold text-[#1E130D]">
                "Thank you for sharing your journey with Musafir Cafe. Safe travels!"
              </p>
              <p>Please visit again ☕</p>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-[#FAF8F4] flex flex-wrap gap-2 justify-between print:hidden">
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-cream text-[#1E130D] text-xs font-bold transition-colors flex items-center space-x-1.5 border border-border shadow-sm"
              >
                <Printer className="w-4 h-4 text-green" />
                <span>Print</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>WhatsApp Bill</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isPaid && (
                <button
                  onClick={handleMarkCashPaid}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-green/10 text-green font-bold text-xs transition-colors flex items-center space-x-1 border border-border"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Paid in Cash</span>
                </button>
              )}

              <button
                onClick={() => setShowGPayModal(true)}
                className="py-2.5 px-4 rounded-xl bg-green hover:bg-green-dark text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isPaid ? 'View GPay Scanner' : 'Pay via GPay'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {showGPayModal && (
        <GPayPaymentModal
          isOpen={showGPayModal}
          onClose={() => setShowGPayModal(false)}
          order={order}
          onPaymentComplete={() => {
            if (onStatusUpdated) onStatusUpdated();
          }}
        />
      )}
    </>
  );
}
