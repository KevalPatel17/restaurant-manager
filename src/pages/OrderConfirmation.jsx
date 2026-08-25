import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Coffee, Sparkles, ChefHat, ArrowLeft, RefreshCw, AlertCircle, Receipt, Smartphone, DollarSign, MessageCircle, Check } from 'lucide-react';
import { api } from '../lib/api';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { whatsappApi } from '../lib/whatsappApi';
import BillInvoiceModal from '../components/BillInvoiceModal';
import GPayPaymentModal from '../components/GPayPaymentModal';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { cafeSettings } = useCart();
  const table = searchParams.get('table') || '1';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showGPayModal, setShowGPayModal] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const fetchOrder = async () => {
    try {
      setError(null);
      const data = await api.getOrderById(id);
      setOrder(data);
      if (data?.whatsapp_sent) {
        setWhatsappSent(true);
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      setError('Could not locate order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    const interval = setInterval(fetchOrder, 6000);

    if (isSupabaseReady && supabase) {
      const channel = supabase
        .channel(`order-status-${id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
          (payload) => {
            setOrder((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
            if (payload.new?.whatsapp_sent) setWhatsappSent(true);
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(interval);
  }, [id]);

  // Explicit 1-Time WhatsApp Send on Button Click Only
  const handleWhatsAppSend = async () => {
    if (!order) return;
    if (!order.customer_phone) {
      toast.error('No mobile number provided for this order');
      return;
    }

    if (whatsappSent) {
      if (!window.confirm('Digital bill was already sent once to this number. Send again?')) {
        return;
      }
    }

    setIsSendingWhatsApp(true);
    try {
      await whatsappApi.sendOneTimeBill(order, cafeSettings);
      setWhatsappSent(true);
      toast.success(`WhatsApp Bill sent to +${order.customer_phone} from +91 9537533472!`);
    } catch (err) {
      toast.error('Failed to send WhatsApp message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const steps = [
    { status: 'New', title: 'Order Received', desc: 'Sent to the barista & kitchen station' },
    { status: 'Preparing', title: 'Brewing & Crafting', desc: 'Your artisan items are being freshly prepared' },
    { status: 'Ready', title: 'Ready for Service', desc: 'Your food & drinks are ready for table delivery' },
    { status: 'Served', title: 'Served & Completed', desc: 'Enjoy your cozy time at Musafir Cafe!' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'New': return 0;
      case 'Preparing': return 1;
      case 'Ready': return 2;
      case 'Served': return 3;
      default: return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isPaid = order?.payment_status === 'Paid';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#C86D3B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#1E130D]">Retrieving order status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F2] py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to={`/menu?table=${table}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#7A6F68] hover:text-[#1E130D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </Link>

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DF9B52]/20 shadow-cafe-card text-center space-y-6">
          
          <div className="w-16 h-16 bg-[#F4EDE4] text-[#2D8A4E] rounded-full mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#2D8A4E]/10 text-[#2D8A4E] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Order #{order?.order_number || id.slice(0, 6)} Confirmed</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E130D]">
              We're Crafting Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
              Table #{order?.table_number || table} • {order?.customer_name || 'Musafir Guest'}
              {order?.customer_phone ? ` (${order.customer_phone})` : ''}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="py-4 space-y-6 text-left border-y border-[#F4EDE4]">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.status} className="flex items-start space-x-4">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-[#1E130D] text-[#ECC980] ring-4 ring-[#DF9B52]/30 shadow-md'
                          : 'bg-[#F4EDE4] text-[#7A6F68]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 transition-all ${
                          idx < currentStep ? 'bg-[#1E130D]' : 'bg-[#F4EDE4]'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 pt-1">
                    <h4
                      className={`text-sm font-bold leading-tight ${
                        isCurrent ? 'text-[#C86D3B]' : isPassed ? 'text-[#1E130D]' : 'text-[#7A6F68]'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-[#7A6F68] mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ordered Items Summary & Bill Trigger */}
          {order?.items && (
            <div className="text-left space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68]">
                  Items in This Order
                </h3>
                <button
                  onClick={() => setShowBillModal(true)}
                  className="text-xs font-bold text-[#C86D3B] hover:text-[#1E130D] flex items-center space-x-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Digital Invoice</span>
                </button>
              </div>

              <div className="space-y-2 bg-[#FDF8F2] p-4 rounded-2xl border border-[#DF9B52]/20">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-semibold text-[#1E130D]">
                        {item.quantity}x {item.name}
                      </span>
                      {item.item_customization && (
                        <p className="text-[11px] text-[#C86D3B] italic">"{item.item_customization}"</p>
                      )}
                    </div>
                    <span className="font-bold text-[#1E130D]">
                      ${(Number(item.price_at_order) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-[#DF9B52]/20 flex justify-between font-bold text-sm text-[#1E130D]">
                  <span>Total Amount</span>
                  <span className="text-[#C86D3B]">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment & Bill Actions */}
          <div className="space-y-2.5 pt-2">
            
            {/* Bill & GPay & 1-Time WhatsApp Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setShowBillModal(true)}
                className="py-3 px-3 rounded-2xl bg-[#F4EDE4] hover:bg-[#DF9B52]/20 text-[#1E130D] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-[#DF9B52]/30 shadow-sm"
              >
                <Receipt className="w-4 h-4 text-[#C86D3B]" />
                <span>View Bill</span>
              </button>

              {/* 1-Time WhatsApp Send Button */}
              <button
                onClick={handleWhatsAppSend}
                disabled={isSendingWhatsApp}
                className={`py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                  whatsappSent
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-[#25D366] hover:bg-[#1EBE5D] text-white'
                }`}
              >
                {whatsappSent ? (
                  <>
                    <Check className="w-4 h-4 text-green-700" />
                    <span>Sent (1x)</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                    <span>{isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowGPayModal(true)}
                className={`py-3 px-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md ${
                  isPaid
                    ? 'bg-[#2D8A4E] text-white'
                    : 'bg-[#1E130D] hover:bg-[#C86D3B] text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#ECC980]" />
                <span>{isPaid ? 'Paid ✓' : 'Pay GPay'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchOrder}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-[#DF9B52]/30 text-[#7A6F68] hover:text-[#1E130D] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Status</span>
              </button>
              <Link
                to={`/menu?table=${table}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#FDF8F2] hover:bg-[#F4EDE4] text-[#1E130D] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-[#DF9B52]/30"
              >
                <Coffee className="w-3.5 h-3.5 text-[#C86D3B]" />
                <span>Order More Items</span>
              </Link>
            </div>

          </div>

        </div>

      </div>

      {/* Bill Modal */}
      {showBillModal && (
        <BillInvoiceModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          order={order}
          onStatusUpdated={fetchOrder}
        />
      )}

      {/* GPay Modal */}
      {showGPayModal && (
        <GPayPaymentModal
          isOpen={showGPayModal}
          onClose={() => setShowGPayModal(false)}
          order={order}
          onPaymentComplete={fetchOrder}
        />
      )}

    </div>
  );
}
