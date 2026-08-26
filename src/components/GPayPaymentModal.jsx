import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Check, Copy, ExternalLink, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { whatsappApi } from '../lib/whatsappApi';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

export default function GPayPaymentModal({ isOpen, onClose, order, onPaymentComplete }) {
  const { cafeSettings } = useCart();
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [generatedUpiQr, setGeneratedUpiQr] = useState(null);

  const amount = Number(order?.total || 0).toFixed(2);
  const upiId = cafeSettings?.upi_id || 'musafir.cafe@okaxis';
  const cafeName = cafeSettings?.cafe_name || 'Musafir Cafe';
  const tableNum = order?.table_number || '1';

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(cafeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Table${tableNum}-Order`)}`;

  useEffect(() => {
    if (isOpen && upiDeepLink) {
      QRCode.toDataURL(upiDeepLink, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1E130D',
          light: '#FFFFFF',
        },
      })
        .then((url) => setGeneratedUpiQr(url))
        .catch((err) => console.warn('UPI QR generation error:', err));
    }
  }, [isOpen, upiDeepLink]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPaid = async () => {
    setIsConfirming(true);
    try {
      if (order?.id) {
        await api.updateOrderPayment(order.id, {
          payment_method: 'GPay_UPI',
          payment_status: 'Paid',
        });
      }

      const paidOrder = {
        ...order,
        payment_method: 'GPay_UPI',
        payment_status: 'Paid',
      };

      if (cafeSettings?.auto_send_whatsapp_bill && paidOrder.customer_phone) {
        whatsappApi.sendAutomatedBill(paidOrder, cafeSettings, 'bill_paid').catch(() => {});
        toast.success(`Paid invoice sent to WhatsApp (+${paidOrder.customer_phone})!`);
      }

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2D8A4E', '#DF9B52', '#C86D3B', '#ECC980'],
        });
      } catch {}

      toast.success('Payment recorded via GPay / UPI! Thank you.');
      if (onPaymentComplete) onPaymentComplete('GPay_UPI');
      onClose();
    } catch (err) {
      console.error('Payment update error:', err);
      toast.error('Could not verify payment');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#DF9B52]/30 flex flex-col max-h-[92vh] animate-slide-up">
        
        {/* Header Banner */}
        <div className="bg-[#1E130D] text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-[#DF9B52]/20 text-[#ECC980] border border-[#DF9B52]/40 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Pay & UPI Instant Pay</span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
            Pay with GPay / Any UPI App
          </h3>
          <p className="text-xs text-white/70 mt-0.5">
            Table #{tableNum} • Order #{order?.order_number || (order?.id ? order.id.slice(0, 5) : '')}
          </p>

          <div className="mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/70 uppercase tracking-wider font-semibold block">Total Amount Due</span>
            <span className="font-serif text-3xl font-black text-[#ECC980]">${amount}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          
          <div className="bg-[#FAF8F4] p-4 rounded-3xl border-2 border-dashed border-[#DF9B52]/40 shadow-inner flex flex-col items-center space-y-3">
            <div className="w-56 h-56 rounded-2xl overflow-hidden bg-white shadow-md border border-[#DF9B52]/20 p-2 flex items-center justify-center">
              <img
                src={cafeSettings?.gpay_qr_url || generatedUpiQr || '/gpay_scanner.jpg'}
                alt="Musafir Cafe GPay UPI QR"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <p className="text-xs font-bold text-[#1E130D]">
              Scan with Google Pay, PhonePe, Paytm, or any banking app
            </p>
          </div>

          <div className="bg-[#FAF8F4] p-3 rounded-2xl flex items-center justify-between gap-2 text-xs border border-border">
            <div className="text-left overflow-hidden">
              <span className="block text-[10px] uppercase font-bold text-muted">Cafe UPI ID</span>
              <span className="font-mono font-bold text-[#1E130D] truncate block">{upiId}</span>
            </div>
            <button
              onClick={handleCopyUpi}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-green hover:text-white text-[#1E130D] font-bold shadow-sm transition-colors flex items-center space-x-1 flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={upiDeepLink}
            className="w-full py-2.5 px-4 bg-[#FAF8F4] hover:bg-green/10 text-[#1E130D] rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors border border-border"
          >
            <Smartphone className="w-4 h-4 text-green" />
            <span>Tap to Pay on Mobile (GPay/PhonePe)</span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </a>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-[#FAF8F4] space-y-2">
          <button
            onClick={handleConfirmPaid}
            disabled={isConfirming}
            className="w-full py-3.5 bg-green hover:bg-green-dark text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Have Paid via GPay (${amount})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
