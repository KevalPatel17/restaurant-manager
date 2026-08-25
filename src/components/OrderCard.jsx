import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Coffee, ChefHat, AlertCircle, ArrowRight, User, Phone, Trash2, Receipt, Smartphone, DollarSign, MessageCircle } from 'lucide-react';
import BillInvoiceModal from './BillInvoiceModal';
import { sendWhatsAppBill } from '../utils/whatsappBill';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function OrderCard({ order, onStatusChange, onDeleteOrder, onRefresh }) {
  const { cafeSettings } = useCart();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    const calculateElapsed = () => {
      if (!order.created_at) return;
      const created = new Date(order.created_at).getTime();
      const now = Date.now();
      const diffMin = Math.floor((now - created) / 60000);
      setElapsedMinutes(Math.max(0, diffMin));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isUrgent = elapsedMinutes >= 10 && order.status !== 'Served';
  const isPaid = order.payment_status === 'Paid';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Served':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete Order #${order.order_number || order.id.slice(0, 5)} for Table #${order.table_number}?`)) {
      onDeleteOrder(order.id);
    }
  };

  const handleWhatsApp = () => {
    sendWhatsAppBill(order, cafeSettings, true);
    toast.success('Opening WhatsApp with digital invoice...');
  };

  return (
    <>
      <div
        className={`bg-white rounded-3xl p-5 border shadow-cafe-soft flex flex-col justify-between transition-all ${
          isUrgent ? 'border-red-400 ring-2 ring-red-300' : 'border-[#DF9B52]/25'
        }`}
      >
        {/* Top Header Info */}
        <div>
          <div className="flex items-start justify-between gap-2 border-b border-[#F4EDE4] pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-black text-xl text-[#1E130D]">
                  Table #{order.table_number}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#7A6F68] mt-1">
                <span className="flex items-center space-x-1 font-semibold text-[#1E130D]">
                  <User className="w-3.5 h-3.5 text-[#C86D3B]" />
                  <span>{order.customer_name || 'Musafir Guest'}</span>
                </span>
                {order.customer_phone && (
                  <span className="flex items-center space-x-1 text-[#7A6F68]">
                    <span>•</span>
                    <Phone className="w-3 h-3 text-[#7A6F68]" />
                    <span>{order.customer_phone}</span>
                  </span>
                )}
                <span>•</span>
                <span className="font-mono">#{order.order_number || order.id.slice(0, 5)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Elapsed Timer */}
              <div
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                  isUrgent
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#F4EDE4] text-[#1E130D]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{elapsedMinutes}m</span>
              </div>

              {/* Delete Order Action */}
              {onDeleteOrder && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-[#7A6F68] hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete/Cancel Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Special Kitchen Note */}
          {order.special_instructions && (
            <div className="my-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              <span className="font-bold">Instructions: </span>
              {order.special_instructions}
            </div>
          )}

          {/* Items List */}
          <div className="py-3 space-y-2.5 divide-y divide-[#FDF8F2]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0">
                <div className="flex items-start space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#1E130D] text-[#ECC980] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.quantity}x
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-[#1E130D] leading-tight block">
                      {item.name}
                    </span>
                    {item.item_customization && (
                      <span className="inline-block mt-0.5 text-xs font-bold text-[#C86D3B] bg-[#C86D3B]/10 px-2 py-0.5 rounded-md">
                        ⚡ {item.item_customization}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-3 border-t border-[#F4EDE4] mt-2 flex items-center gap-2">
          {order.status === 'New' && (
            <button
              onClick={() => onStatusChange(order.id, 'Preparing')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#C86D3B] hover:bg-[#1E130D] text-white text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
            >
              <ChefHat className="w-4 h-4" />
              <span>Start Brewing / Prep</span>
            </button>
          )}

          {order.status === 'Preparing' && (
            <button
              onClick={() => onStatusChange(order.id, 'Ready')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#2D8A4E] hover:bg-green-700 text-white text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Ready to Serve</span>
            </button>
          )}

          {order.status === 'Ready' && (
            <button
              onClick={() => onStatusChange(order.id, 'Served')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E130D] hover:bg-[#C86D3B] text-white text-xs font-bold shadow transition-colors flex items-center justify-center space-x-1.5"
            >
              <Coffee className="w-4 h-4 text-[#ECC980]" />
              <span>Complete Order</span>
            </button>
          )}

          {order.status === 'Served' && (
            <span className="w-full text-center text-xs font-semibold text-[#2D8A4E] py-2 bg-green-50 rounded-xl">
              ✓ Served to Table
            </span>
          )}
        </div>
      </div>

      {/* Digital Bill Modal */}
      {showBillModal && (
        <BillInvoiceModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          order={order}
          onStatusUpdated={onRefresh}
        />
      )}
    </>
  );
}
